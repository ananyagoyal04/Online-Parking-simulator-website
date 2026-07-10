#8
#include <stdio.h>
#include <string.h>

#define MAX 500
int t[MAX];

void shifttable(char p[]) {
    int i, j, m;
    m = strlen(p);
    for(i = 0; i < MAX; i++) t[i] = m;
    for(j = 0; j < m - 1; j++) t[(int)p[j]] = m - 1 - j;
}

int horspool(char src[], char p[]) {
    int i, j, k, m, n;
    n = strlen(src);
    m = strlen(p);
    i = m - 1;
    while(i < n) {
        k = 0;
        while((k < m) && (p[m - 1 - k] == src[i - k])) k++;
        if(k == m) return(i - m + 1);
        else i += t[(int)src[i]];
    }
    return -1;
}

void main() {
    char src[100], p[100];
    int pos;
    printf("Enter the text:\n");
    scanf(" %[^\n]s", src);
    printf("Enter the pattern:\n");
    scanf(" %[^\n]s", p);
    shifttable(p);
    pos = horspool(src, p);
    if(pos >= 0) printf("\nPattern found at position %d", pos + 1);
    else printf("\nPattern not found");
}

