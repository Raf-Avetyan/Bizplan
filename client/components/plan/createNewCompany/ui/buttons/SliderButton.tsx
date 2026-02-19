import { ChevronRight } from 'lucide-react-native';
import { Text } from 'react-native';
import { TouchableOpacity } from 'react-native';

interface ISliderButton {
   isNextDisabled: boolean
   setActiveTab: React.Dispatch<React.SetStateAction<{
      name: "idea" | "place" | "unique" | "businessName";
      id: number;
   }>>
   inputText: {
      idea: string;
      place: string;
      uniqueTags: string[];
      businessName: string;
   }
   activeTab: {
      name: "idea" | "place" | "unique" | "businessName";
      id: number;
   }
   isLoading: boolean
   onCreate?: () => void;
}

export default function SliderButton({
   isNextDisabled,
   setActiveTab,
   inputText,
   activeTab,
   isLoading,
   onCreate
}: ISliderButton) {
   const handlePress = () => {
      if (activeTab.name === "businessName" && onCreate) {
         onCreate();
         return;
      }

      setActiveTab((prevTab) => {
         let newName = "";

         if (prevTab.name === "idea" && inputText.idea.trim().length >= 5) {
            newName = "place";
         } else if (prevTab.name === "place" && inputText.place.trim().length) {
            newName = "unique";
         } else if (prevTab.name === "unique" && inputText.uniqueTags.length >= 3) {
            newName = "businessName";
         }

         if (newName === "") {
            return prevTab;
         } else {
            return {
               name: newName as "idea" | "place" | "unique" | "businessName",
               id: prevTab.id + 1,
            };
         }
      });
   };

   const isCreateButton = activeTab.name === "businessName";
   const buttonText = isCreateButton ? "Ստեղծել" : "Հաջորդ";

   return (
      <TouchableOpacity
         onPress={handlePress}
         disabled={isNextDisabled || (isCreateButton && isLoading)}
         className={`
            flex flex-row items-center justify-center 
            bg-[#01a06d] rounded-[8px] gap-2 
            ${(isNextDisabled || (isCreateButton && isLoading)) ? 'opacity-50' : ''}
         `}
      >
         <Text
            className="font-Arm_Hmks_Bebas_Neue text-white text-[20px] py-3"
            style={{ letterSpacing: 1 }}
         >
            {isLoading && isCreateButton ? "Ստեղծվում է..." : buttonText}
         </Text>
         {!isCreateButton && <ChevronRight size={24} color="#fff" />}
      </TouchableOpacity>
   );
}