import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PublishedChatView from '@/components/published/PublishedChatView'

interface Props {
  params: { slug: string }
}

export default async function PublishedPage({ params }: Props) {
  const supabase = createClient()

  const { data: published } = await supabase
    .from('published_chats')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!published) notFound()

  // Increment view count
  await supabase
    .from('published_chats')
    .update({ view_count: published.view_count + 1 })
    .eq('id', published.id)

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', published.chat_id)
    .order('message_index', { ascending: true })

  return <PublishedChatView published={published} messages={messages ?? []} />
}
