---
layout: "../../layouts/Markdown.astro"
title: CS
---

## Binary

8 bit unsigned number
`[0 - 255]`

8 bit signed numbers
`[-128 - 127]`

The high-order (leftmost) bit is interpreted as the number's sign:
0 - positive
1 - negative

Negative numbers are represented in standard two's complement notation.
Basically, we flip the bits and add 1. If you flip the bits, the high-order bit will naturally determine the sign
The "flip the bits" can be done either by using _unary NOT_ or _XOR 0xFF_.

for a positive integer, each position that there is 1 in, you put as a exponent to 2
7|6|5|4|3|2|1|0

```
00000001 -> 2^0 -> 1
00001000 -> 2^3 -> 8
00001010 -> 2^3 + 2^1 -> 10
```

for a negative integer
there is a "correct" way:
You still do all the same, except, in the end you subtract it from -128
```
11111011 -> -128 + 2^6 + 2^5 + 2^4 + 2^3 + 2^1 + 2^0 -> -128 + 64 + 32 + 16 + 8 + 2 + 1 -> -5
```
or there is my way:
each position there is a zero in, do -1*(2^pos) and subtract 1
```
11111011 -> -1 * (2 ^ 2) - 1 -> -5
11111110 -> -1 * (2 ^ 0) - 1 -> -2
11111100 -> -(2^0 + 2^1) - 1 -> -4
10000000 -> -(2^6 + 2^5 + 2^4 + 2^3 + 2^2 + 2^1 + 2^0) - 1 -> -128
```

Basically, we use a mirroring, if we flip the bits, we flip the way we calculate the numbers

Now, when we expand the integer to 16 bit, we need to "pad left"
for positive numbers, we pad with 0
```
8-bit:  00000101 (5)
16-bit: 0000000000000101 (still 5)
```

for negatives, same "flip" principle applies
```
8-bit:  11111011 (-5)
16-bit: 1111111111111011 (still -5)
```


The thing to keep in mind is to not screw up with signed or unsigned,
because while `11111011` is -5 in a signed interpretation,
for unsigned it's 251
