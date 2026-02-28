import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchBar } from 'react-native-screens';

export default function SearchIndex() {
   return (
      <>
         <SearchBar placement="automatic" placeholder="Search" onChangeText={() => { }} />
         <LinearGradient
            colors={["#4D2FB2", "#2B1A66", "#050510"]}
            style={{ flex: 1 }}
            locations={[0, 0.6, 1]}
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
