"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MainLayout } from "./components/layout/GeneralLayout";
function NotFound() {
  const router = useRouter();
  return (
    <MainLayout>
      <div className="flex flex-col flex-1 gap-6 items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-6">
        <h1 className="text-2xl">It seems that you got lost!</h1>
        <p className="text-2xl">Error 404</p>
        </div>
        <Image
          src="../assets/img/psyduck.svg"
          alt="not-found"
          width={300} // Width of the image
          height={300} // Height of the image
        ></Image>
        <div>
          <button
            onClick={() => router.push("/")}
            className="text-white  bg-blue-600 font-medium rounded-lg text-sm px-5 py-2.5 inline-flex justify-center w-full text-center"
          >
            Back to Home
          </button>
        </div>
      </div>
    </MainLayout>
  );
}

export default NotFound;
