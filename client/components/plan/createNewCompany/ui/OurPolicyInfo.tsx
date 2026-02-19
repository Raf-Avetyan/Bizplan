import { Lock } from 'lucide-react-native';
import { Text, View } from 'react-native';

export default function OurPolicyInfo() {
   return (
      <View className="flex flex-row items-center gap-3">
         <Lock size={16} color="#ffffffaf" />
         <View className="flex flex-cosl">
            <Text className="text-white/40 text-[12px] font-Arm_Hmks_Bebas_Neue">
               Մասնավոր և անվտանգ։ Տեսեք մեր{" "}
               <Text className="text-blue-700 font-Arm_Hmks_Bebas_Neue">
                  գաղտնիության քաղաքականությունը։
               </Text>
            </Text>
         </View>
      </View>
   )
}