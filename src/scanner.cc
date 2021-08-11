#include <tree_sitter/parser.h>
#include <vector>
#include <cwctype>
#include <cstring>
#include <cassert>
#include <stdio.h>
namespace
{
using std::iswspace;
using std::memcpy;
using std::vector;

enum TokenType {
	NEWLINE,
	STRING_START,
	STRING_CONTENT,
	STRING_END,
};

struct Delimiter {
	enum {
		SingleQuote = 1 << 0,
		DoubleQuote = 1 << 1,
	};

	Delimiter() : flags(0)
	{
	}

	int32_t end_character() const
	{
		if (flags & SingleQuote)
			return '\'';
		if (flags & DoubleQuote)
			return '"';
		return 0;
	}

	void set_end_character(int32_t character)
	{
		switch (character) {
		case '\'':
			flags |= SingleQuote;
			break;
		case '"':
			flags |= DoubleQuote;
			break;
		default:
			assert(false);
		}
	}

	char flags;
};

struct Scanner {
	Scanner()
	{
		assert(sizeof(Delimiter) == sizeof(char));
		deserialize(NULL, 0);
	}

	unsigned serialize(char *buffer)
	{
		size_t i = 0;

		size_t delimiter_count = delimiter_stack.size();
		if (delimiter_count > UINT8_MAX)
			delimiter_count = UINT8_MAX;
		buffer[i++] = delimiter_count;

		if (delimiter_count > 0) {
			memcpy(&buffer[i], delimiter_stack.data(),
			       delimiter_count);
		}
		i += delimiter_count;

		return i;
	}

	void deserialize(const char *buffer, unsigned length)
	{
		delimiter_stack.clear();

		if (length > 0) {
			size_t i = 0;

			size_t delimiter_count = (uint8_t)buffer[i++];
			delimiter_stack.resize(delimiter_count);
			if (delimiter_count > 0) {
				memcpy(delimiter_stack.data(), &buffer[i],
				       delimiter_count);
			}
			i += delimiter_count;
		}
	}

	void advance(TSLexer *lexer)
	{
		lexer->advance(lexer, false);
	}

	void skip(TSLexer *lexer)
	{
		lexer->advance(lexer, true);
	}

	void mark_end(TSLexer *lexer)
	{
		lexer->mark_end(lexer);
	}

	bool scan(TSLexer *lexer, const bool *valid_symbols)
	{
		if (valid_symbols[STRING_CONTENT] && !delimiter_stack.empty()) {
			Delimiter delimiter = delimiter_stack.back();
			int32_t end_character = delimiter.end_character();
			bool has_content = false;
			while (lexer->lookahead) {
				if (lexer->lookahead == '\\') {
					mark_end(lexer);
					lexer->result_symbol = STRING_CONTENT;
					return has_content;
				}
				if (lexer->lookahead == end_character) {
					if (has_content) {
						lexer->result_symbol =
							STRING_CONTENT;
					} else {
						advance(lexer);
						delimiter_stack.pop_back();
						lexer->result_symbol =
							STRING_END;
					}
					mark_end(lexer);
					return true;
				}
				if (lexer->lookahead == '\n' && has_content) {
					return false;
				}
				advance(lexer);
				has_content = true;
			}
		}

		mark_end(lexer);

		bool found_end_of_line = false;
		int32_t is_comment = false;
		for (;;) {
			if (lexer->lookahead == '\n') {
				found_end_of_line = true;
				skip(lexer);
			} else if (lexer->lookahead == ' ') {
				skip(lexer);
			} else if (lexer->lookahead == '\r' ||
				   lexer->lookahead == '\f') {
				skip(lexer);
			} else if (lexer->lookahead == '\t') {
				skip(lexer);
			} else if (lexer->lookahead == '#') {
				if (!is_comment) {
					is_comment = true;
				}
				// skip all characters after # and also the newlines
				while (lexer->lookahead &&
				       lexer->lookahead != '\n') {
					skip(lexer);
				}
				skip(lexer);
			} else if (lexer->lookahead == '\\') {
				skip(lexer);
				if (iswspace(lexer->lookahead)) {
					skip(lexer);
				} else {
					return false;
				}
			} else if (lexer->lookahead == 0) {
				found_end_of_line = true;
				break;
			} else {
				break;
			}
		}

		if (found_end_of_line) {
			if (valid_symbols[NEWLINE]) {
				lexer->result_symbol = NEWLINE;
				return true;
			}
		}

		if (!is_comment && valid_symbols[STRING_START]) {
			Delimiter delimiter;

			if (lexer->lookahead == '\'') {
				delimiter.set_end_character('\'');
				advance(lexer);
				mark_end(lexer);
			} else if (lexer->lookahead == '"') {
				delimiter.set_end_character('"');
				advance(lexer);
				mark_end(lexer);
			}

			if (delimiter.end_character()) {
				delimiter_stack.push_back(delimiter);
				lexer->result_symbol = STRING_START;
				return true;
			}
			return false;
		}

		return false;
	}

	vector<Delimiter> delimiter_stack;
};

} // namespace

extern "C" {

void *tree_sitter_trafficscript_external_scanner_create()
{
	return new Scanner();
}

bool tree_sitter_trafficscript_external_scanner_scan(void *payload,
						     TSLexer *lexer,
						     const bool *valid_symbols)
{
	Scanner *scanner = static_cast<Scanner *>(payload);
	return scanner->scan(lexer, valid_symbols);
}

unsigned tree_sitter_trafficscript_external_scanner_serialize(void *payload,
							      char *buffer)
{
	Scanner *scanner = static_cast<Scanner *>(payload);
	return scanner->serialize(buffer);
}

void tree_sitter_trafficscript_external_scanner_deserialize(void *payload,
							    const char *buffer,
							    unsigned length)
{
	Scanner *scanner = static_cast<Scanner *>(payload);
	scanner->deserialize(buffer, length);
}

void tree_sitter_trafficscript_external_scanner_destroy(void *payload)
{
	Scanner *scanner = static_cast<Scanner *>(payload);
	delete scanner;
}
}
/* vim: set fdm=marker ts=2 sw=2 tw=0 et :*/
