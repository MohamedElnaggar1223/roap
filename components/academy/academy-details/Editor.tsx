'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { cn } from '@/lib/utils'
import { ComponentPropsWithoutRef, forwardRef, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import Underline from '@tiptap/extension-underline'
import Strike from '@tiptap/extension-strike'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

import {
    Bold as BoldIcon,
    Italic as ItalicIcon,
    Underline as UnderlineIcon,
    Strikethrough as StrikethroughIcon,
    Link as LinkIcon,
    Heading1 as HeadingIcon,
    Heading2 as SubHeadingIcon,
    Quote as BlockquoteIcon,
    Code as CodeIcon,
    List as ListIcon,
    ListOrdered as ListOrderedIcon,
    Paperclip as PaperclipIcon,
} from 'lucide-react'

interface TipTapEditorProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onChange' | 'value'> {
    value: string
    onValueChange: (value: string) => void
    disabled?: boolean
}

const TipTapEditor = forwardRef<HTMLDivElement, TipTapEditorProps>(({ value, onValueChange, className, disabled, ...props }, ref) => {
    const [linkUrl, setLinkUrl] = useState('')
    const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2]
                },
            }),
            Underline,
            Strike,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-500 underline'
                },
                validate: url => /^https?:\/\//.test(url),
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'max-w-full h-auto rounded-lg',
                },
                inline: true,
            }),
        ],
        content: value,
        editorProps: {
            attributes: {
                class: cn(
                    'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    className
                ),
            },
        },
        onUpdate: ({ editor }) => {
            onValueChange(editor.getHTML())
        },
    })

    const addLink = () => {
        if (!linkUrl) return

        let url = linkUrl
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url
        }

        if (editor) {
            if (editor.state.selection.empty) {
                editor
                    .chain()
                    .focus()
                    .insertContent(`<a href="${url}">${url}</a>`)
                    .run()
            } else {
                editor
                    .chain()
                    .focus()
                    .setLink({ href: url })
                    .run()
            }

            setLinkUrl('')
            setIsLinkPopoverOpen(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addLink()
        }
    }

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file && editor) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const result = e.target?.result
                if (typeof result === 'string') {
                    editor
                        .chain()
                        .focus()
                        .setImage({ src: result })
                        .run()
                }
            }
            reader.readAsDataURL(file)
            if (event.target) {
                event.target.value = ''  // Reset file input
            }
        }
    }

    const handleAttachClick = () => {
        fileInputRef.current?.click()
    }

    if (!editor) return null

    return (
        <div ref={ref} {...props}>
            <div className="border-b p-2 flex flex-wrap gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(editor.isActive('bold') && 'bg-muted')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <BoldIcon className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(editor.isActive('italic') && 'bg-muted')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <ItalicIcon className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(editor.isActive('underline') && 'bg-muted')}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                    <UnderlineIcon className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(editor.isActive('strike') && 'bg-muted')}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                >
                    <StrikethroughIcon className="h-4 w-4" />
                </Button>

                <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={cn(editor.isActive('link') && 'bg-muted')}
                        >
                            <LinkIcon className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="start">
                        <div className="flex gap-2">
                            <Input
                                type="url"
                                placeholder="Enter URL (e.g., https://example.com)"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <Button
                                onClick={addLink}
                                size="sm"
                                type="button"
                            >
                                Add
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(editor.isActive('heading', { level: 1 }) && 'bg-muted')}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                >
                    <HeadingIcon className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(editor.isActive('heading', { level: 2 }) && 'bg-muted')}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                    <SubHeadingIcon className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(editor.isActive('blockquote') && 'bg-muted')}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                >
                    <BlockquoteIcon className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(editor.isActive('codeBlock') && 'bg-muted')}
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                >
                    <CodeIcon className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(editor.isActive('bulletList') && 'bg-muted')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    <ListIcon className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(editor.isActive('orderedList') && 'bg-muted')}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    <ListOrderedIcon className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAttachClick}
                    className="cursor-pointer"
                >
                    <PaperclipIcon className="h-4 w-4" />
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                />
            </div>
            <EditorContent disabled={disabled} editor={editor} />
        </div>
    )
})
TipTapEditor.displayName = 'TipTapEditor'

export default TipTapEditor