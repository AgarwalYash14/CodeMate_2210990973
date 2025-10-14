import { Plus } from 'lucide-react';
import Footer from '../components/Footer';
import Hero from '../components/Hero';

export default function Home() {
    return (
        <>
            <div className="relative h-screen bg-gradient-to-b from-black via-gray-900 to-gray-800 text-gray-100">
                <div className="flex h-screen w-full flex-col items-center justify-center text-center md:hidden">
                    <h1 className="px-2 text-lg font-semibold">
                        Please view site on a larger screen
                    </h1>
                </div>
                <div className="hidden h-screen flex-col gap-20 px-10 py-8 md:flex">
                    <Hero />
                    <div className="flex flex-1 flex-col justify-center gap-6 text-center">
                        <h3 className="mx-auto bg-gray-100 px-1 text-sm text-gray-900">
                            The Top Coding Education Platform for Everyone
                        </h3>
                        <h1 className="text-7xl font-bold">
                            Code Here.{' '}
                            <span className="bg-gradient-to-r from-purple-500 to-pink-300 bg-clip-text text-transparent">
                                Code Now.
                            </span>
                        </h1>
                        <button className="group mx-auto flex w-fit cursor-pointer items-center gap-2 bg-green-600 px-3 py-2 text-lg transition-colors duration-200 hover:bg-green-700">
                            <Plus className="transition-transform duration-500 group-hover:rotate-90" />
                            Create New Session
                        </button>
                        <p className="text-sm">
                            Want to join an existing session?{' '}
                            <button className="cursor-pointer text-green-600 underline underline-offset-4 hover:text-green-700">
                                Join Now
                            </button>
                        </p>
                    </div>
                    <Footer />
                </div>
            </div>
        </>
    );
}
