import { MagicCard } from "@/components/ui/magic-card";
import BlurFade from "@/components/ui/blur-fade";
import { Chrome, Newspaper, Palmtree } from "lucide-react";

// Update PromptCard to include onClick prop
const PromptCard = ({ icon, text, index, onClick }: { icon: React.ReactNode; text: string; index: number; onClick: () => void }) => (
  <BlurFade key={index} delay={1 + index * 0.05} inView>
    <MagicCard
      className="cursor-pointer aspect-square w-full max-w-[100px] sm:max-w-full
                 hover:border-red-300 hover:border-2 hover:shadow-lg hover:shadow-red-300/50
                 transition-all duration-300"
      gradientOpacity={0.05}
      onClick={onClick} // Pass the onClick prop to MagicCard
    >
      <div className="flex flex-col h-full w-full p-1 sm:p-4">
        <div className="mb-auto self-start w-4 h-4 sm:w-6 sm:h-6 m-1 sm:m-0">{icon}</div>
        <p className="text-[10px] sm:text-sm lg:text-lg text-start mt-auto">{text}</p>
      </div>
    </MagicCard>
  </BlurFade>
);

// Update Prompts to accept onPromptClick prop
export function Prompts({ onPromptClick }: { onPromptClick: (text: string) => void }) {
  return (
    <div className="flex justify-center w-full">
      <div className="grid grid-cols-3 gap-6 sm:gap-7 max-w-[400px] sm:max-w-[600px] lg:max-w-[900px]">
        <PromptCard
          icon={<Chrome className="w-full h-full text-red-500" />}
          text="Tell me about Browserbase"
          index={0}
          onClick={() => {
            onPromptClick("Tell me about Browserbase");
          }}
        />
        <PromptCard
          icon={<Newspaper className="w-full h-full text-orange-500" />}
          text="What's on Y Combinator"
          index={1}
          onClick={() => {
            onPromptClick("What's the top recent news about on https://news.ycombinator.com/")
          }}
        />
        <PromptCard
          icon={<Palmtree className="w-full h-full text-green-500" />}
          text="Tell me fun activities in SF"
          index={2}
          onClick={() => {
            onPromptClick("Tell me fun activities in SF")
          }}
        />
      </div>
    </div>
  );
}
