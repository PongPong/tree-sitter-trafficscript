
; Special identifiers
;--------------------

; ([
;     (identifier)
;     (global_identifier)
;  ] @constant)
; 

; ((identifier) @variable.builtin
;  (#match? @variable.builtin "^(arguments|module|console|window|document)$")
;  (#is-not? local))

; ((identifier) @function.builtin
;  (#eq? @function.builtin "import")
;  (#is-not? local))

; Function
;--------------------------------

(function_declaration
   name: (identifier) @function)

; (pair
;    key: (property_identifier) @function.method
;    value: (member_expression))

(variable_declaration (assignment_expression
   left: (scalar_identifier) @function
   right: (member_expression)))

(variable_declaration (assignment_expression
   left: (global_identifier) @function
   right: (member_expression)))

(assignment_expression
   left: (scalar_identifier) @function
   right: (member_expression))

(assignment_expression
   left: (global_identifier) @function
   right: (member_expression))

; Function and method calls
;--------------------------

(call_expression
  function: (member_expression
    property: (property_identifier) @function.method))

(call_expression
  function: (member_expression
    module: (identifier) @variable.builtin
    (#match? @variable.builtin "^(array|hash|json|lang|math|string|sys|auth|connection|data|event|geo|glb|http|java|log|net|pool|radius|rate|recentconns|request|response|rtsp|rule|sip|slm|ssl|stats|sys|tcp|udp|xml)$")
    ))

; Variables
;----------

(scalar_identifier) @variable

; Properties
;-----------

(property_identifier) @property

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
; 
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
