import ChatClient from '@/components/ai/ChatClient'
import React from 'react'

async function page({
    params,
}: {
    params: { slug: string }
}) {

    const { slug } = await params

    console.log(slug)

    return (
        <div>
            <ChatClient slug={slug}/>
        </div>
    )
}

export default page