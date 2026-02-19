import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchBar } from 'react-native-screens';

export default function SearchIndex() {
   return (
      <>
         <SearchBar placement="automatic" placeholder="Search" onChangeText={() => { }} />
         <LinearGradient
            colors={["#4D2FB2", "#061E29"]}
            style={{ flex: 1 }}
         >
            <ScrollView>
               <SafeAreaView>
                  <Text>Search</Text>
               </SafeAreaView>
            </ScrollView>
         </LinearGradient>
      </>
   );
}
