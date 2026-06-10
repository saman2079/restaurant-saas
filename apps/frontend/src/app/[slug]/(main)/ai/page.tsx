import ChatClient from '@/components/ai/ChatClient'
import React from 'react'

async function page({
    params,
}: {
    params: { slug: string }
}) {

    const { slug } = await params

    return (
        <div>
            <ChatClient slug={slug}/>
        </div>
    )
}

export default page