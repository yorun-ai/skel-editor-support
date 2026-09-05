package ai.yorun.skel

import com.intellij.openapi.actionSystem.IdeActions
import com.intellij.testFramework.fixtures.BasePlatformTestCase

class SkelEditorTest : BasePlatformTestCase() {
    override fun setUp() {
        super.setUp()
        project.getService(SkelSettings::class.java).loadState(SkelSettings.Options(enabled = false))
    }
    fun testFileTypeAndFlatPsi() {
        val file = myFixture.configureByText("example.skel", "domain example\ndata Customer { id: uuid }")
        assertSame(SkelFileType.INSTANCE, file.fileType)
        assertSame(SkelLanguage, file.language)
        assertEquals("domain example\ndata Customer { id: uuid }", file.text)
    }
    fun testLineCommentToggle() {
        myFixture.configureByText("example.skel", "<caret>domain example")
        myFixture.performEditorAction(IdeActions.ACTION_COMMENT_LINE)
        assertTrue(myFixture.editor.document.text.trimStart().startsWith("//"))
        myFixture.performEditorAction(IdeActions.ACTION_COMMENT_LINE)
        assertEquals("domain example", myFixture.editor.document.text.trim())
    }
    fun testBraceAndQuoteInsertion() {
        myFixture.configureByText("example.skel", "data Customer <caret>")
        myFixture.type('{')
        myFixture.checkResult("data Customer {<caret>}")
        myFixture.configureByText("string.skel", "@description(<caret>)")
        myFixture.type('"')
        myFixture.checkResult("@description(\"<caret>\")")
    }
    fun testDescriptorUsesSkelLanguageAndSchemaOptions() {
        project.getService(SkelSettings::class.java).state.baseline = "schema.json"
        val descriptor = SkelLspServerDescriptor(project)
        val file = myFixture.configureByText("example.skel", "domain example").virtualFile
        assertEquals("skel", descriptor.getLanguageId(file))
        val options = descriptor.createInitializationOptions() as Map<*, *>
        assertEquals("schema.json", (options["schemaCompatibility"] as Map<*, *>)["baseline"])
    }
}
