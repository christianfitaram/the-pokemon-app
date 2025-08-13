import Image from "next/image";
import { MainLayout } from "@/components/layout/GeneralLayout";
import { LinkCard } from "@/components/pokemon-details/SeeAlso";
import { FaHome, FaRandom, FaMailBulk} from "react-icons/fa";
function NotFound() {
  return (
    <MainLayout>
      <div className="flex flex-col flex-1 gap-6 items-center justify-center">
        <div className="flex flex-row gap-10">
          <Image
            src="../assets/img/psyduck.svg"
            alt="not-found"
            width={300} // Width of the image
            height={300} // Height of the image
          ></Image>
          <div className="flex flex-col items-center justify-center gap-6">
            <div>
              <h1 className="text-2xl">It seems that you got lost!</h1>
            </div>
            <LinkCard url="/">
              <FaHome className="h-5 w-5" />
              Go Home
            </LinkCard>
            <LinkCard url="/random-pokemon">
              <FaRandom className="h-5 w-5" />
              Random Pokemon
            </LinkCard>
            <LinkCard url="mailto:christianfitaram@gmail.com">
              <FaMailBulk className="h-5 w-5" />
              Report Error
            </LinkCard>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default NotFound;
