import Image from 'next/image'
import React from 'react'

export default function () {
    return (
        <div>
            <div className="relative min-h-[300px] max-h-[420px] h-[50dvh] z-0 ">
                <Image
                    src={"/imge/menu-bg.png"}
                    alt=''
                    fill
                    className='object-cover'
                />
                <div className='absolute inset-0 bg-[linear-gradient(0.41deg,rgba(0,0,0,0)_62.89%,rgba(55,55,55,0.61)_94.4%)]' />
            </div>
        </div>
    )
}
