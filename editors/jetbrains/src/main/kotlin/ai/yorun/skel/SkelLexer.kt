package ai.yorun.skel

import com.intellij.lexer.LexerBase
import com.intellij.psi.TokenType
import com.intellij.psi.tree.IElementType

/** Lexical highlighting only. Semantic validation belongs to skelc. */
class SkelLexer : LexerBase() {
    private var buffer: CharSequence = ""
    private var limit = 0
    private var start = 0
    private var end = 0
    private var token: IElementType? = null

    override fun start(buffer: CharSequence, startOffset: Int, endOffset: Int, initialState: Int) {
        this.buffer = buffer
        limit = endOffset
        end = startOffset
        advance()
    }
    // Strings and comments are whole tokens; each token boundary is a restart point.
    override fun getState() = 0
    override fun getTokenType() = token
    override fun getTokenStart() = start
    override fun getTokenEnd() = end
    override fun getBufferSequence() = buffer
    override fun getBufferEnd() = limit

    private fun at(text: String, offset: Int = end): Boolean =
        offset + text.length <= limit && text.indices.all { buffer[offset + it] == text[it] }
    private fun identifierStart(c: Char) = c in 'a'..'z' || c in 'A'..'Z' || c == '_'
    private fun identifierPart(c: Char) = identifierStart(c) || c in '0'..'9'

    override fun advance() {
        start = end
        if (start >= limit) { token = null; return }
        val c = buffer[end]
        when {
            c.isWhitespace() -> {
                while (end < limit && buffer[end].isWhitespace()) end++
                token = TokenType.WHITE_SPACE
            }
            at("//") -> {
                while (end < limit && buffer[end] != '\n' && buffer[end] != '\r') end++
                token = SkelTokens.LINE_COMMENT
            }
            at("/*") -> {
                end += 2
                while (end < limit && !at("*/")) end++
                if (at("*/")) end += 2
                token = SkelTokens.BLOCK_COMMENT
            }
            c == '"' -> {
                val delimiter = if (at("\"\"\"")) "\"\"\"" else "\""
                end += delimiter.length
                while (end < limit) {
                    if (at(delimiter)) { end += delimiter.length; break }
                    if (buffer[end] == '\\' && end + 1 < limit) end += 2 else end++
                }
                token = SkelTokens.STRING
            }
            c == '@' -> {
                end++
                if (end < limit && identifierStart(buffer[end])) {
                    while (end < limit && identifierPart(buffer[end])) end++
                }
                token = SkelTokens.ANNOTATION
            }
            identifierStart(c) -> {
                while (end < limit && identifierPart(buffer[end])) end++
                val word = buffer.subSequence(start, end).toString()
                token = when {
                    word in SkelVocabulary.keywords -> SkelTokens.KEYWORD
                    word in SkelVocabulary.builtinTypes || c in 'A'..'Z' -> SkelTokens.TYPE
                    else -> SkelTokens.IDENTIFIER
                }
            }
            c in '0'..'9' -> {
                while (end < limit && buffer[end] in '0'..'9') end++
                token = SkelTokens.NUMBER
            }
            else -> {
                end++
                token = when (c) {
                    '{' -> SkelTokens.LBRACE
                    '}' -> SkelTokens.RBRACE
                    '(' -> SkelTokens.LPAREN
                    ')' -> SkelTokens.RPAREN
                    '[' -> SkelTokens.LBRACKET
                    ']' -> SkelTokens.RBRACKET
                    in ",.:;?<>-=+" -> SkelTokens.PUNCTUATION
                    else -> TokenType.BAD_CHARACTER
                }
            }
        }
    }
}
