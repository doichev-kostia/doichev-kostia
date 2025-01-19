---
layout: "../../layouts/Markdown.astro"
title: Odin notes
---

# Odin

## Goodies
swizzle
array programming
similar to Kotlin's TODO, there is `unimplemented`
package `slashpath` for non-os path (like URL)


explicit procedure overloading
```odin
bool_to_string :: proc(b: bool) -> string {...}
int_to_string  :: proc(i: int)  -> string {...}

to_string :: proc{bool_to_string, int_to_string}
```

The double colon `::` is used for declarations that are immutable/constant in nature (types, constants, procedures),
while the single colon `:` is used for mutable variable declarations.

```odin
// Variable declaration uses single :
x: int = 42
y := "hello"

// Constants use ::
PI :: 3.14159
MAX_SIZE :: 1024

// Procedures use ::
add :: proc(a, b: int) -> int {
    return a + b
}

// Type aliases use ::
My_Int :: int
Vec2 :: [2]f32
My_Proc :: proc(int) -> bool
```


## Specifics
slice and map have a default value `nil`
functions are called `proc` (procedures)
context is very important and a core feature

#### Naming
In general:
`Ada_Case` for types
`snake_case` for values

```
Package Name:       snake_case (but prefer single word)
Import Name:        snake_case (but prefer single word)
Types:              Ada_Case
Enum Values:        Ada_Case
Procedures:         snake_case
Local Variables:    snake_case
Constant Variables: SCREAMING_SNAKE_CASE
```

#### Calling conventions
because context is an implicit thing that is passed around there are calling conventions
the default one is "odin" which has an implicit context
```odin
foo :: proc "odin" () {

}
// is the same as
foo :: proc () {

}
```

However, if there is a foreign function that calls into the odin code, it needs to create a context explicitly
```odin
foo :: proc "c" () {
	context = runtime.default_context()
	fmt.println("some c function")
}
```

You may ask: "How come we define c function and what for?" Well, for interop with foreign libs.
For example - Open GL
```odin
import "base:runtime"
import "core:fmt"
import "vendor:glfw"

error_callback :: proc "c" (code: i32, desc: cstring) {
	context = runtime.default_context()
	fmt.println(desc, code)
}

main :: proc() {
	glfw.SetErrorCallback(error_callback)
}
```
the `error_callback` is a function that is passed to the foreign library

#### Parameters
The function parameters are immutable therefore, if you want to change them, you need to shadow
```odin
foo :: proc(v: int) -> int {
	// this will not work
	// v = v - 1

	// shadow the variable
	v := v
	v = v - 1
	return v
}
```

#### Map
if an element of a map doesn't exist, the zero (default) value is returned
```odin
m := make(map[string]int)
v := m["john"]
assert(v == 0)
// to check
v1, ok := m["john"] // comma ok idiom
// or
ok := "john" in m
```

#### Bit Fields
example:
```odin
	Color_Channel :: bit_field u16 {
		red:   u8 | 5, // 5 bits, no need to specify type
		green: u8 | 6, // 6 bits
		blue:  u8 | 5, // 5 bits
	}
	color: Color_Channel
	color.red = 31 // Maximum red
	color.green = 0 // No green
	color.blue = 15 // Mid-level blue


	fmt.printf("size is %d\n", size_of(color)) // size is 2
	fmt.printf("value is %v\n", color) // value is Color_Channel{red = 31, green = 0, blue = 15}
```

#### Bit set
basically have some boolean flags encoded into 1 byte
example - file system permissions
```odin
Permission :: enum {Read, Write, Execute}
Permission_Set :: bit_set[Permission]

file_perms: Permission_Set
file_perms = {.Read, .Execute}  // A file that can be read and executed but not written
```

## Questions

what's the difference between `#assert` and `assert`? -> `#assert` runs at compile-time
is `#` a directive or a tag? i.e. `Value :: union #no_nil {bool, string}`, `struct #align(4) {...}` -> directive
what is the `@thread_local global_default_temp_allocator_data: Default_Temp_Allocator`?
there is something called `context.temp_allocator` used in package `filepath` in `join :: proc`

### Testing

```odin
import "core:log"
import "core:testing"

@(test)
test_sum :: proc(t: ^testing.T) {
	a:= 2
	b:=2
	sum:= a + b

	log.info("the sum is: ")
	log.infof("%d", sum)
	testing.expect(t, sum == 4)
}

```
