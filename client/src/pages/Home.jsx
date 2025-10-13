import { Plus } from "lucide-react";
import Footer from "../components/Footer";

export default function Home() {
    return (
        <>
            <div className="h-screen text-gray-100 bg-gradient-to-b from-black via-gray-900 to-gray-800 relative">
                <div className="flex md:hidden h-screen w-full flex-col justify-center items-center text-center">
                    <h1 className="text-lg font-semibold px-2">
                        Please view site on a larger screen
                    </h1>
                </div>
                <div className="hidden md:flex h-screen flex-col gap-20 px-10 py-8">
                    <div className="flex-1 flex flex-col justify-center text-center gap-6">
                        <h3 className="text-sm bg-gray-100 text-gray-900 mx-auto px-1">
                            The Top Coding Education Platform for Everyone
                        </h3>
                        <h1 className="text-7xl font-bold">
                            Code Here.{" "}
                            <span className="bg-gradient-to-r from-purple-500 to-pink-300 bg-clip-text text-transparent">
                                Code Now.
                            </span>
                        </h1>
                        <button className="cursor-pointer text-lg bg-green-600 hover:bg-green-700 px-3 items-center py-2 w-fit mx-auto flex gap-2 group transition-colors duration-200">
                            <Plus className="group-hover:rotate-90 transition-transform duration-500" />
                            Create New Session
                        </button>
                        <p className="text-sm">
                            Want to join an existing session?{" "}
                            <button className="text-green-600 cursor-pointer hover:text-green-700 underline underline-offset-4">
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
