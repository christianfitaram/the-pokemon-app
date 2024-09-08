"use client";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
function NotFound() {
    const router = useRouter();
    return (
        <div className="flex flex-col items-center space-y-6">
            <h1 className='text-2xl'>It seems that you got lost!</h1>
            <p className='text-2xl'>Error 404</p>
            <Image src="../assets/img/psyduck.svg"
                alt='not-found'
                width={300} // Width of the image
                height={300} // Height of the image
            >
            </Image>
            <div>
                <button onClick={() => router.push('/')} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-200 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-900 font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-center w-full text-center">
                    Back to Home
                </button>
            </div>
        </div>
    )
}

export default NotFound;