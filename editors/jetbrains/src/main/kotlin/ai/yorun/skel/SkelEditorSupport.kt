package ai.yorun.skel

import com.intellij.extapi.psi.PsiFileBase
import com.intellij.lang.ASTNode
import com.intellij.lang.BracePair
import com.intellij.lang.Commenter
import com.intellij.lang.PairedBraceMatcher
import com.intellij.lang.ParserDefinition
import com.intellij.lang.PsiParser
import com.intellij.openapi.editor.highlighter.HighlighterIterator
import com.intellij.codeInsight.editorActions.SimpleTokenSetQuoteHandler
import com.intellij.openapi.project.Project
import com.intellij.psi.FileViewProvider
import com.intellij.psi.PsiFile
import com.intellij.extapi.psi.ASTWrapperPsiElement
import com.intellij.psi.tree.IElementType
import com.intellij.psi.tree.IFileElementType
import com.intellij.psi.tree.TokenSet

/** A flat token tree for editor APIs, deliberately without Skel semantic parsing. */
class SkelParserDefinition : ParserDefinition {
    override fun createLexer(project: Project?) = SkelLexer()
    override fun createParser(project: Project?) = PsiParser { root, builder ->
        val file = builder.mark()
        while (!builder.eof()) builder.advanceLexer()
        file.done(root)
        builder.treeBuilt
    }
    override fun getFileNodeType() = FILE
    override fun getCommentTokens() = TokenSet.create(SkelTokens.LINE_COMMENT, SkelTokens.BLOCK_COMMENT)
    override fun getStringLiteralElements() = TokenSet.create(SkelTokens.STRING)
    override fun createElement(node: ASTNode) = ASTWrapperPsiElement(node)
    override fun createFile(viewProvider: FileViewProvider) = object : PsiFileBase(viewProvider, SkelLanguage) {
        override fun getFileType() = SkelFileType.INSTANCE
    }
    companion object { val FILE = IFileElementType(SkelLanguage) }
}

class SkelCommenter : Commenter {
    override fun getLineCommentPrefix() = "//"
    override fun getBlockCommentPrefix() = "/*"
    override fun getBlockCommentSuffix() = "*/"
    override fun getCommentedBlockCommentPrefix(): String? = null
    override fun getCommentedBlockCommentSuffix(): String? = null
}

class SkelBraceMatcher : PairedBraceMatcher {
    override fun getPairs() = arrayOf(
        BracePair(SkelTokens.LBRACE, SkelTokens.RBRACE, true),
        BracePair(SkelTokens.LPAREN, SkelTokens.RPAREN, false),
        BracePair(SkelTokens.LBRACKET, SkelTokens.RBRACKET, false)
    )
    override fun isPairedBracesAllowedBeforeType(lbraceType: IElementType, contextType: IElementType?) = true
    override fun getCodeConstructStart(file: PsiFile, openingBraceOffset: Int) = openingBraceOffset
}

class SkelQuoteHandler : SimpleTokenSetQuoteHandler(SkelTokens.STRING) {
    override fun isOpeningQuote(iterator: HighlighterIterator, offset: Int): Boolean =
        super.isOpeningQuote(iterator, offset) && iterator.document.charsSequence[offset] == '"'
}
