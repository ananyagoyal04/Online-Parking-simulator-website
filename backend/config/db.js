/**
 * ParkWise Resilient Database Adapter
 * Seamlessly connects to MongoDB when available; falls back to an embedded
 * high-performance In-Memory datastore if MongoDB is offline or not installed.
 */

const mongoose = require("mongoose");
const BANGALORE_AREAS = require("./bangaloreAreas");

let isMongoConnected = false;
let inMemoryStore = {
  users: [],
  spots: [],
  bookings: [],
  transactions: []
};

// Seed initial spots for in-memory mode
function seedInMemorySpots() {
  inMemoryStore.spots = [];
  const SLOT_PREFIXES = ["A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2", "VIP-1", "EV-1"];
  const BLOCKS = ["Ground Plaza", "North Annex", "South Wing", "Basement B1", "Basement B2"];

  BANGALORE_AREAS.forEach(area => {
    const areaKey = `${parseFloat(area.lat).toFixed(3)}_${parseFloat(area.lng).toFixed(3)}`;
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * 2 * Math.PI + (i % 3) * 0.15;
      const radius = 0.0008 + (i % 4) * 0.0006;
      const isEv = i === 9;
      const isVip = i === 8;
      const initialStatus = i < 6 ? "empty" : (i < 8 ? "full" : "empty");

      inMemoryStore.spots.push({
        _id: `mem_spot_${areaKey}_${i + 1}`,
        areaKey,
        areaName: area.name,
        area: area.name,
        id: i + 1,
        lat: parseFloat((area.lat + radius * Math.cos(angle)).toFixed(6)),
        lng: parseFloat((area.lng + radius * Math.sin(angle)).toFixed(6)),
        name: `Slot ${SLOT_PREFIXES[i]} · ${BLOCKS[i % BLOCKS.length]}`,
        status: initialStatus,
        rate: isVip ? Math.round(area.baseRate * 1.35) : (isEv ? Math.round(area.baseRate * 1.4) : area.baseRate),
        spotType: isEv ? "ev" : (isVip ? "vip" : "standard"),
        bookedBy: null,
        bookingId: null,
        bookedAt: null,
        createdAt: new Date()
      });
    }
  });
}

// In-Memory Model Query Wrapper to emulate Mongoose syntax
class InMemoryModel {
  constructor(collectionName) {
    this.name = collectionName;
  }

  get data() {
    return inMemoryStore[this.name] || [];
  }

  set data(val) {
    inMemoryStore[this.name] = val;
  }

  async find(filter = {}) {
    let results = this.data.filter(item => matchFilter(item, filter));
    const builder = {
      _results: results.map(item => ({ ...item })),
      sort(sortObj) {
        if (sortObj) {
          const [key, dir] = Object.entries(sortObj)[0] || [];
          if (key) {
            this._results.sort((a, b) => {
              const va = a[key], vb = b[key];
              if (va instanceof Date || vb instanceof Date) {
                return dir === -1 ? new Date(vb) - new Date(va) : new Date(va) - new Date(vb);
              }
              return dir === -1 ? (vb > va ? 1 : -1) : (va > vb ? 1 : -1);
            });
          }
        }
        return this;
      },
      select() {
        return this;
      },
      lean() {
        return this._results;
      },
      then(resolve, reject) {
        return Promise.resolve(this._results).then(resolve, reject);
      }
    };
    return builder;
  }

  async findOne(filter = {}) {
    let item = this.data.find(it => matchFilter(it, filter));
    if (!item) return null;
    const doc = { ...item };
    doc.save = async function() {
      const idx = inMemoryStore[this._collectionName].findIndex(x => x._id === doc._id || (x.bookingId && x.bookingId === doc.bookingId) || (x.username && x.username === doc.username));
      if (idx !== -1) {
        inMemoryStore[this._collectionName][idx] = { ...doc };
      }
      return doc;
    }.bind({ _collectionName: this.name });

    return {
      ...doc,
      lean: () => ({ ...doc }),
      save: doc.save,
      then: (resolve) => resolve(doc)
    };
  }

  async create(docData) {
    const newDoc = {
      _id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
      ...docData
    };
    newDoc.save = async function() {
      const idx = inMemoryStore[this.name].findIndex(x => x._id === newDoc._id);
      if (idx !== -1) inMemoryStore[this.name][idx] = { ...newDoc };
      return newDoc;
    }.bind(this);

    this.data.push(newDoc);
    return newDoc;
  }

  async insertMany(docs) {
    const inserted = docs.map((d, i) => ({
      _id: `mem_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
      ...d
    }));
    this.data.push(...inserted);
    return inserted;
  }

  async findOneAndUpdate(filter, update, options = {}) {
    const item = this.data.find(it => matchFilter(it, filter));
    if (!item) return null;
    const changes = update.$set || update;
    Object.assign(item, changes);
    return { ...item };
  }

  async countDocuments(filter = {}) {
    return this.data.filter(it => matchFilter(it, filter)).length;
  }

  async deleteOne(filter = {}) {
    const idx = this.data.findIndex(it => matchFilter(it, filter));
    if (idx !== -1) {
      this.data.splice(idx, 1);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }
}

function matchFilter(item, filter) {
  if (!filter || Object.keys(filter).length === 0) return true;
  if (filter.$or && Array.isArray(filter.$or)) {
    const orMatches = filter.$or.some(subFilter => matchFilter(item, subFilter));
    if (!orMatches) return false;
    const remaining = { ...filter };
    delete remaining.$or;
    return matchFilter(item, remaining);
  }
  for (let [key, val] of Object.entries(filter)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      if (val.$ne !== undefined && item[key] === val.$ne) return false;
      if (val.$in !== undefined && !val.$in.includes(item[key])) return false;
      if (val.$gte !== undefined && item[key] < val.$gte) return false;
      if (val.$lte !== undefined && item[key] > val.$lte) return false;
    } else {
      if (item[key] !== val) return false;
    }
  }
  return true;
}

// Connect Database Function
async function connectDB() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/parkwise";
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2500
    });
    isMongoConnected = true;
    console.log(`✅ [Database] Connected to MongoDB database → ${mongoUri}`);
  } catch (err) {
    isMongoConnected = false;
    seedInMemorySpots();
    console.log(`⚠️  [Database] MongoDB not reachable (${err.message})`);
    console.log(`🚀 [Database] ParkWise active in Resilient In-Memory High Performance Mode (Zero Setup)`);
  }
}

function getDatabaseStatus() {
  return {
    engine: isMongoConnected ? "MongoDB" : "Resilient InMemory Store",
    connected: true,
    mongoConnected: isMongoConnected,
    totalInMemorySpots: inMemoryStore.spots.length,
    activeBookings: inMemoryStore.bookings.filter(b => b.active).length
  };
}

module.exports = {
  connectDB,
  isMongoConnected: () => isMongoConnected,
  getDatabaseStatus,
  InMemoryModel,
  inMemoryStore
};
