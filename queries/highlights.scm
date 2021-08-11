
; Special identifiers
;--------------------

([
    (identifier)
    (scalar_identifier)
    (global_identifier)
 ] @constant
 (#match? @constant "^[A-Z_][A-Z\\d_]+$"))


((identifier) @constructor
 (#match? @constructor "^[A-Z]"))

((identifier) @variable.builtin
 (#match? @variable.builtin "^(arguments|module|console|window|document)$")
 (#is-not? local))

((identifier) @function.builtin
 (#eq? @function.builtin "import")
 (#is-not? local))

; Function
;--------------------------------

(function
  name: (identifier) @function)
(function_declaration
  name: (identifier) @function)

; (pair
;   key: (property_identifier) @function.method
;   value: [(function) (function)])

; (assignment_expression
;   left: (_member_expression
;     property: (property_identifier) @function.method)
;   right: [(function) (function)])

; (variable_declaration
;   name: (identifier) @function
;   value: [(function) (function)])

; (assignment_expression
;   left: (identifier) @function
;   right: [(function) (function)])

; Function and method calls
;--------------------------

(call_expression
  function: (identifier) @function)

; (call_expression
;   function: (member_expression
;     property: (property_identifier) @function.method))

; Variables
;----------

(scalar_identifier) @variable

; Properties
;-----------

; (property_identifier) @property

; Literals
;---------
[
  (true)
  (false)
] @constant.builtin

(comments) @comment

[
  (string)
] @string

(number) @number

; Tokens
;-------


[
  ";"
  "."
  ","
] @punctuation.delimiter

[
  "-"
  "--"
  "-="
  "+"
  "++"
  "+="
  "*"
  "*="
  "/"
  "/="
  "%"
  "%="
  "<"
  "<="
  "<<"
  "<<="
  "="
  "=="
  "!"
  "!="
  "=>"
  ">"
  ">="
  ">>"
  ">>="
  ; ">>>"
  ; ">>>="
  "~"
  "^"
  "&"
  "|"
  "^="
  "&="
  "|="
  "&&"
  "||"
] @operator

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
]  @punctuation.bracket

[
  "as"
  "break"
  "case"
  "continue"
  "default"
  "do"
  "else"
  "for"
  "sub"
  "if"
  "import"
  "in"
  "return"
  "switch"
  "while"
] @keyword
