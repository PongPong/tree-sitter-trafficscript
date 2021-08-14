// the constant contains the order of precedence.
// the higher the value, higher the precedence.
module.exports = grammar({
  name: 'trafficscript',

  // inline: $ => [
  //   $._string_content,
  //   //$.member_expression,
  //   //$._call_signature,
  //   //$.statement,
  //   $._expressions,
  //   $.semi_colon,
  //   $.identifier,
  // ],

  conflicts: _$ => [
  ],

  precedences: $ => [
    [
      'string',
      'comments', // comments over anything, except in strings
      'member', // . member access
      'call', // function call
      'postfix_update_exp', // i++ i-- operator
      'prefix_update_exp', // ++i --i operator
      'unary_not', // unary + - ! -    
      'binary_times', // * / % operator
      'binary_plus', // + = . operator
      'binary_shift',// << >>
      'binary_relation',// < > <= >=
      'binary_equality', // == !=
      'bitwise_and', // & 
      'bitwise_xor', // ^
      'bitwise_or', // |
      'logical_and', // &&
      'logical_or', // ||
      'ternary_operator', // ?:
      'assignment_operators', // = += etc
      $.primary_expression,
      $.statement_block,
      'hash'
    ],
    ['declaration', 'literal'],
    ['declaration', $.expression],
    ['member', $.expression],
  ],

  extras: $ => [
    $.comments,
    /[\s\uFEFF\u2060\u200B\u00A0]/, // any kind of whitespace
  ],


  supertypes: $ => [
    $.statement,
    $.declaration,
    $.expression,
    $.primary_expression,
  ],

  externals: $ => [
    $._newline,
    $._string_start,
    $._string_content,
    $._string_end,
  ],

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat($.statement),

    //
    // Statements
    //

    statement: $ => choice(
      $.import_statement,
      $.expression_statement,
      $.declaration,
      $.statement_block,

      $.if_statement,
      $.switch_statement,
      $.for_statement,
      $.for_each_statement,
      $.while_statement,
      $.do_statement,

      $.break_statement,
      $.continue_statement,
      $.return_statement,
      $.empty_statement,
    ),

    expression_statement: $ => seq(
      $.expression,
      $.semi_colon,
    ),


    //
    // Import declarations
    //
    //import: _$ => token('import'),

    import_statement: $ => choice(
      seq(
        'import',
        field('source', $.identifier),
        $.semi_colon,
      ),
      seq(
        'import',
        field('source', $.identifier),
        'as',
        field('alias', $.identifier),
        $.semi_colon,
      )
    ),

    else_clause: $ => seq('else', $.statement),

    if_statement: $ => prec.right(seq(
      'if',
      field('condition', $.parenthesized_expression),
      field('consequence', $.statement),
      optional(field('alternative', $.else_clause))
    )),

    switch_statement: $ => seq(
      'switch',
      field('value', seq(
        '(',
        $.expression,
        optional(seq(',', $.member_expression)),
        ')'
      )),
      field('body', $.switch_body)
    ),

    switch_body: $ => seq(
      '{',
      repeat($.switch_case),
      optional($.switch_default),
      '}'
    ),

    switch_case: $ => seq(
      'case',
      field('value', $._expressions),
      ':',
      repeat($.statement),
    ),

    switch_default: $ => seq(
      'default',
      ':',
      repeat($.statement),
    ),

    empty_statement: _$ => ';',

    break_statement: $ => seq('break', $.semi_colon),

    continue_statement: $ => seq(
      'continue',
      $.semi_colon
    ),


    while_statement: $ => seq(
      'while',
      field('condition', $.parenthesized_expression),
      field('body', $.statement),
    ),

    // the C - style for loop
    for_statement: $ => seq(
      'for',
      $._for_parenthesize,
      field('body', $.statement_block),
    ),

    _for_parenthesize: $ => seq(
      '(',
      optional(field('initializer', $.expression)),
      $.semi_colon,
      optional(field('condition', $.expression)),
      $.semi_colon,
      optional(field('incrementor', $.expression)),
      ')'
    ),

    for_each_statement: $ => seq(
      'foreach',
      $._foreach_parenthesize,
      field('body', $.statement_block),
    ),

    _foreach_parenthesize: $ => seq(
      '(',
      field('left', $.scalar_identifier),
      'in',
      field('right', $.expression),
      ')',
    ),

    do_statement: $ => seq(
      'do',
      field('body', $.statement),
      'while',
      field('condition', $.parenthesized_expression),
      $.semi_colon
    ),


    declaration: $ => choice(
      $.function_declaration,
      $.variable_declaration,
    ),

    variable_declaration: $ => prec('declaration', seq(
      commaSep1($.assignment_expression),
      $.semi_colon
    )),

    //     variable_declarator: $ => seq(
    //       field('name', $.identifier),
    //       $._initializer
    //     ),
    // 
    //     _initializer: $ => seq(
    //       '=',
    //       field('value', $.expression),
    //     ),

    _call_signature: $ => field('parameters', $.formal_parameters),

    function: $ => prec.left('literal', seq(
      'sub',
      field('name', optional($.identifier)),
      $._call_signature,
      field('body', $.statement_block)
    )),

    function_declaration: $ => prec.left('declaration', seq(
      'sub',
      field('name', $.identifier),
      $._call_signature,
      field('body', $.statement_block)
    )),

    formal_parameters: $ => seq(
      '(',
      prec.left('call',
        optional(seq(
          commaSep1($.scalar_identifier),
          optional(',')
        ))),
      ')'
    ),

    statement_block: $ => seq(
      '{',
      optional(repeat($.statement)),
      '}'
    ),

    parenthesized_expression: $ => seq(
      '(',
      prec.left($.expression),
      ')'
    ),

    return_statement: $ => seq(
      'return',
      optional($.expression),
      $.semi_colon
    ),

    expression: $ => choice(
      $.primary_expression,
      // $.member_expression,
      $.assignment_expression, // right
      $.unary_expression, // right
      $.binary_expression, // left
      $.ternary_expression, // right
      $.update_expression, // prefix: right, postfix: none
    ),

    primary_expression: $ => choice(
      $.subscript_expression,
      $.parenthesized_expression,
      $.identifier,
      $.scalar_identifier,
      $.global_identifier,
      $.number,
      $.string,
      $.true,
      $.false,
      $.hash,
      $.array,
      $.function,
      $.call_expression,
    ),

    // begin of operators
    binary_expression: $ => choice(
      ...[
        ['&&', 'logical_and'],
        ['||', 'logical_or'],
        ['>>', 'binary_shift'],
        //['>>>', 'binary_shift'],
        ['<<', 'binary_shift'],
        ['&', 'bitwise_and'],
        ['^', 'bitwise_xor'],
        ['|', 'bitwise_or'],
        ['+', 'binary_plus'],
        ['.', 'binary_plus'],
        ['-', 'binary_plus'],
        ['*', 'binary_times'],
        ['/', 'binary_times'],
        ['%', 'binary_times'],
        ['<', 'binary_relation'],
        ['<=', 'binary_relation'],
        ['==', 'binary_equality'],
        ['!=', 'binary_equality'],
        ['>=', 'binary_relation'],
        ['>', 'binary_relation'],
      ].map(([operator, precedence]) =>
        prec.left(precedence, seq(
          field('left', $.expression),
          field('operator', operator),
          field('right', $.expression)
        ))
      )
    ),

    ternary_expression: $ => prec.right("ternary_operator", seq(
      field('condition', $.expression),
      field('operator', '?'),
      field('true', $.expression),
      field('operator', ':'),
      field('false', $.expression),
    )),

    // no associativity
    // auto increment and auto decrement
    update_expression: $ => choice(
      prec.right('prefix_update_exp', seq(
        field('operator', choice('++', '--')),
        field('variable', $.expression),
      )),
      prec('postfix_update_exp', seq(
        field('variable', $.expression),
        field('operator', choice('++', '--')),
      )),
    ),

    unary_expression: $ => choice(...[
      ['!', 'unary_not'],
      ['~', 'unary_not'],
      ['-', 'unary_not'],
      //['+', 'unary_not'],
    ].map(([operator, precedence]) =>
      prec.right(precedence, seq(
        field('operator', operator),
        field('argument', $.expression)
      ))
    )),

    assignment_expression: $ => choice(
      ...[
        '=',
        '+=',
        '*=',
        '&=',
        '<<=',
        '-=',
        '/=',
        '|=',
        '>>=',
        '.=',
        '%=',
        '^=',
      ].map((operator) =>
        prec.right('assignment_operators',
          seq(
            field('left', choice(
              $.subscript_expression,
              $.scalar_identifier,
              $.global_identifier
            )),
            field('operator', operator),
            field('right', $.expression),
          ),
        ))
    ),

    // end of operators
    call_expression: $ => prec.left('call', seq(
      field('function', $.member_expression),
      field('arguments', $.arguments)
    )),

    member_expression: $ => choice(
      seq(
        field('module', repeat(seq(
          $.identifier,
          token.immediate('.'),
        ))),
        field('property', alias($.identifier, $.property_identifier))
      ),
      field('property', alias($.identifier, $.property_identifier))
    ),

    subscript_expression: $ => prec.left('member', seq(
      field('object', choice($.scalar_identifier, $.primary_expression)),
      '[', field('index', $._expressions), ']'
    )),

    arguments: $ => prec.left('call', seq(
      '(',
      commaSep($.expression),
      ')'
    )),

    _expressions: $ => choice(
      $.expression,
      $.sequence_expression
    ),

    sequence_expression: $ => seq(
      field('left', $.expression),
      ',',
      field('right', choice($.sequence_expression, $.expression))
    ),

    number: _$ => {
      const hex_literal = seq(
        choice('0x', '0X'),
        /[\da-fA-F](_?[\da-fA-F])*/
      )

      const decimal_digits = /\d(_?\d)*/
      const signed_integer = seq(optional(choice('-', '+')), decimal_digits)
      const exponent_part = seq(choice('e', 'E'), signed_integer)

      const binary_literal = seq(choice('0b', '0B'), /[0-1](_?[0-1])*/)

      const octal_literal = seq(choice('0o', '0O'), /[0-7](_?[0-7])*/)

      const bigint_literal = seq(choice(hex_literal, binary_literal, octal_literal, decimal_digits), 'n')

      const decimal_integer_literal = choice(
        '0',
        seq(optional('0'), /[1-9]/, optional(seq(optional('_'), decimal_digits)))
      )

      const decimal_literal = choice(
        seq(decimal_integer_literal, '.', optional(decimal_digits), optional(exponent_part)),
        seq('.', decimal_digits, optional(exponent_part)),
        seq(decimal_integer_literal, exponent_part),
        seq(decimal_digits),
      )

      return token(choice(
        hex_literal,
        decimal_literal,
        binary_literal,
        octal_literal,
        bigint_literal,
      ))
    },

    // the strings
    string: $ => seq(
      alias($._string_start, '"'),
      repeat(choice($.escape_sequence, $._not_escape_sequence, $._string_content)),
      alias($._string_end, '"')
    ),

    escape_sequence: _$ => token(prec(1, seq(
      '\\',
      choice(
        /u[a-fA-F\d]{4}/,
        /U[a-fA-F\d]{8}/,
        /x[a-fA-F\d]{2}/,
        /\d{3}/,
        /\r?\n/,
        /['"abfrntv\\]/,
      )
    ))),

    _not_escape_sequence: _$ => '\\',

    scalar_identifier: _$ => {
      const alpha = /[^\x00-\x1F\s0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()\[\]{}\uFEFF\u2060\u200B\u00A0]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}/
      const alphanumeric = /[^\x00-\x1F\s:;`"'@#.,|^&<=>+\-*/\\%?!~()\[\]{}\uFEFF\u2060\u200B\u00A0]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}/
      return token(seq('$', alpha, repeat(alphanumeric)))
    },

    global_identifier: _$ => /\$[1-9]/, // $1 - $9 global variables

    identifier: _$ => {
      const alpha = /[^\x00-\x1F\s0-9:;`"'@#.,|^&<=>+\-*/\\%?!~()\[\]{}\uFEFF\u2060\u200B\u00A0]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}/
      const alphanumeric = /[^\x00-\x1F\s:;`"'@#.,|^&<=>+\-*/\\%?!~()\[\]{}\uFEFF\u2060\u200B\u00A0]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}/
      return token(seq(alpha, repeat(alphanumeric)))
    },

    semi_colon: _$ => ';',

    not_escape_sequence: _$ => '\\',

    true: _$ => 'true',
    false: _$ => 'false',


    _property_name: $ => choice(
      alias($.scalar_identifier, $.property_identifier),
      $.string,
      $.number,
    ),


    hash: $ => prec('hash', seq(
      '[',
      commaSep($.pair),
      ']'
    )),

    array: $ => seq(
      '[',
      commaSep1($.expression),
      ']'
    ),


    pair: $ => seq(
      field('key', $._property_name),
      '=>',
      field('value', $.expression)
    ),

    // some key words
    comments: _$ => token(prec("comments", choice(
      /#.*/, // single line comment
    ))),

  }
});

/**
 * repeats the rule comma separated, like
 * rule, rule
 * example: (a, b);
 * using it in the above.
 * @param {*} rule 
 */
function commaSep(rule) {
  return optional(commaSep1(rule));
}
/**
 * repeats the rule comma separated at least once, like
 * rule 
 * rule, rule
 * example: (a, b);
 * using it in the above.
 * @param {*} rule 
 */
function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

