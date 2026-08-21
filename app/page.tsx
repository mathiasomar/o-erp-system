import { getSetting } from "@/actions/settings.action";
import { ModeToggle } from "@/components/ModeToggle";
import SignInForm from "@/components/SignInForm";
import { ThemeAwareImage } from "@/components/ThemeAwareImage";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const HomePage = async () => {
  const company_name = (await getSetting("company_name")) || "Your Company";
  const logo_url = await getSetting("logo_url");
  const logo_dark_url = await getSetting("logo_dark_url");
  return (
    <div className="absolute w-full h-screen flex items-center justify-center p-4">
      <div className="absolute top-5 right-5">
        <ModeToggle />
      </div>
      <div className="w-full md:w-[80%] lg:w-[60%] border rounded-lg flex flex-col md:flex-row min-h-150 md:min-h-150 overflow-hidden">
        {/* Form Section - Full width on mobile, half on desktop */}
        <div className="w-full md:w-1/2 bg-background p-6 sm:p-8 md:p-10 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="flex justify-center mb-6 md:hidden">
              <Avatar className="w-30 h-30">
                <ThemeAwareImage
                  lightSrc={logo_url}
                  darkSrc={logo_dark_url}
                  alt="POS System"
                  priority
                />
              </Avatar>
            </div>
            <div className="flex flex-col justify-center items-center">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">O-POS</h1>
              <p className="text-center">Welcome back!</p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center">
                {company_name}
              </h1>
              <p className="text-sm mt-4 text-center">Login to your account</p>
              <Separator className="my-6" />
              <SignInForm />
            </div>
          </div>
        </div>

        {/* Image Section - Hidden on mobile/tablet, visible on desktop */}
        <div className="hidden md:block md:w-1/2 relative bg-slate-800">
          <div className="absolute inset-0">
            <ThemeAwareImage
              lightSrc={logo_url}
              darkSrc={logo_dark_url}
              alt="POS System"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
