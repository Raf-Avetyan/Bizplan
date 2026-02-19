import React, { useState, useEffect, useRef } from 'react';
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   TouchableOpacity,
   TextInput,
   Dimensions,
   Alert,
   ActivityIndicator,
   KeyboardAvoidingView,
   Platform,
   TouchableWithoutFeedback,
   Keyboard,
   TextStyle,
   ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PageBlock } from '../(tabs)/(dashboard)/components/Content';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BusinessPlanTemplate } from '@/types/business-plan.types';
import { useActiveCompany, useCompanyAdditionalData, useUpdateCompanyAdditionalData } from '@/hooks/useCompanyQueries';

const { height } = Dimensions.get('window');

type BlockStyle = TextStyle & ViewStyle & { width?: number | string; height?: number | string; };

export default function EditPage() {
   const router = useRouter();
   const params = useLocalSearchParams<{ pageIndex: string }>();
   const { data: activeCompany } = useActiveCompany();
   const { data: companyAdditionalData, isLoading } = useCompanyAdditionalData(activeCompany?.id);
   const updateCompanyData = useUpdateCompanyAdditionalData();

   const pageIndex = parseInt(params.pageIndex);
   const companyId = activeCompany?.id;

   const [currentPlan, setCurrentPlan] = useState<BusinessPlanTemplate | null>(null);
   const [selectedBlock, setSelectedBlock] = useState<PageBlock | null>(null);
   const [editingContent, setEditingContent] = useState('');
   const [toolsVisible, setToolsVisible] = useState(true);
   const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
   const [isSaving, setIsSaving] = useState(false);

   const scrollViewRef = useRef<ScrollView>(null);
   const blockRefs = useRef<Map<string, View>>(new Map());

   useEffect(() => {
      if (companyAdditionalData?.business_plan) {
         setCurrentPlan(companyAdditionalData.business_plan as BusinessPlanTemplate);
      }
   }, [companyAdditionalData]);

   const currentPage = currentPlan?.presentation?.pages?.[pageIndex];

   useEffect(() => {
      if (hasUnsavedChanges && companyId && !isSaving && currentPlan) {
         const timer = setTimeout(() => {
            handleSave();
         }, 30000);

         return () => clearTimeout(timer);
      }
   }, [currentPlan, hasUnsavedChanges, companyId]);

   const hasScrolledForBlock = useRef<Map<string, boolean>>(new Map());

   useEffect(() => {
      if (selectedBlock && scrollViewRef.current) {
         const blockRef = blockRefs.current.get(selectedBlock.id);

         if (blockRef && !hasScrolledForBlock.current.get(selectedBlock.id)) {
            setTimeout(() => {
               blockRef.measureLayout(
                  scrollViewRef.current as any,
                  (x: number, y: number, width: number, height: number) => {
                     scrollViewRef.current?.scrollTo({
                        y: y + height - 150,
                        animated: true,
                     });
                     hasScrolledForBlock.current.set(selectedBlock.id, true);
                  },
                  () => { }
               );
            }, 300);
         }
      }
   }, [selectedBlock]);

   useEffect(() => {
      if (!selectedBlock) {
         hasScrolledForBlock.current.clear();
      }
   }, [selectedBlock]);

   const editTools = [
      { id: 'h1', name: 'H1', icon: 'title', type: 'heading', level: 1 },
      { id: 'h2', name: 'H2', icon: 'title', type: 'heading', level: 2 },
      { id: 'h3', name: 'H3', icon: 'title', type: 'heading', level: 3 },
      { id: 'h4', name: 'H4', icon: 'title', type: 'heading', level: 4 },
      { id: 'h5', name: 'H5', icon: 'title', type: 'heading', level: 5 },
      { id: 'h6', name: 'H6', icon: 'title', type: 'heading', level: 6 },
      { id: 'paragraph', name: 'Text', icon: 'text-fields', type: 'paragraph' },
      { id: 'bold', name: 'Bold', icon: 'format-bold', type: 'style', style: { fontWeight: 'bold' } },
      { id: 'italic', name: 'Italic', icon: 'format-italic', type: 'style', style: { fontStyle: 'italic' } },
      { id: 'underline', name: 'Underline', icon: 'format-underlined', type: 'style', style: { textDecorationLine: 'underline' } },
      { id: 'list', name: 'List', icon: 'list', type: 'list' },
      { id: 'image', name: 'Image', icon: 'insert-photo', type: 'image' },
      { id: 'quote', name: 'Quote', icon: 'format-quote', type: 'quote' },
      { id: 'divider', name: 'Divider', icon: 'horizontal-rule', type: 'divider' },
      { id: 'align-left', name: 'Left', icon: 'format-align-left', type: 'style', style: { textAlign: 'left' } },
      { id: 'align-center', name: 'Center', icon: 'format-align-center', type: 'style', style: { textAlign: 'center' } },
      { id: 'align-right', name: 'Right', icon: 'format-align-right', type: 'style', style: { textAlign: 'right' } },
   ];

   const handleBlockSelect = (block: PageBlock) => {
      setSelectedBlock(block);
      if (typeof block.content === 'string') {
         setEditingContent(block.content);
      } else if (Array.isArray(block.content)) {
         setEditingContent(JSON.stringify(block.content, null, 2));
      } else {
         setEditingContent('');
      }
   };

   const handleDeselectBlock = () => {
      setSelectedBlock(null);
      setEditingContent('');
      Keyboard.dismiss();
   };

   const updateBlockContent = (blockId: string, newContent: string) => {
      if (!currentPlan || !currentPage) return;

      const updatedBlocks = currentPage.blocks.map(block => {
         if (block.id === blockId) {
            let parsedContent: string | string[] = newContent;
            if (block.type === 'list' && newContent.startsWith('[')) {
               try {
                  parsedContent = JSON.parse(newContent);
               } catch (e) {
                  parsedContent = newContent;
               }
            }
            return { ...block, content: parsedContent };
         }
         return block;
      });

      const updatedPage = {
         ...currentPage,
         blocks: updatedBlocks
      };

      const updatedPages = currentPlan.presentation.pages.map((page, index) => {
         if (index === pageIndex) {
            return updatedPage;
         }
         return page;
      });

      const updatedPlan = {
         ...currentPlan,
         presentation: {
            ...currentPlan.presentation,
            pages: updatedPages,
         }
      };

      setCurrentPlan(updatedPlan);
      setHasUnsavedChanges(true);

      if (selectedBlock?.id === blockId) {
         setSelectedBlock({
            ...selectedBlock,
            content: newContent
         });
      }
   };

   const applyStyle = (blockId: string, style: any) => {
      if (!currentPlan || !currentPage) return;

      const styleKey = Object.keys(style)[0] as keyof BlockStyle;
      const styleValue = style[styleKey as keyof typeof style];

      const hasStyleProperty = selectedBlock?.styles?.hasOwnProperty(styleKey);

      const updatedBlocks = currentPage.blocks.map(block =>
         block.id === blockId
            ? {
               ...block,
               styles: hasStyleProperty
                  ? Object.keys(block.styles || {}).reduce((acc, key) => {
                     if (key !== styleKey) {
                        (acc as any)[key] = block.styles?.[key as keyof BlockStyle];
                     }
                     return acc;
                  }, {} as BlockStyle)
                  : { ...(block.styles || {}), [styleKey]: styleValue } as BlockStyle
            }
            : block
      );

      const updatedPage = {
         ...currentPage,
         blocks: updatedBlocks
      };

      const updatedPages = currentPlan.presentation.pages.map((page, index) => {
         if (index === pageIndex) {
            return updatedPage;
         }
         return page;
      });

      const updatedPlan = {
         ...currentPlan,
         presentation: {
            ...currentPlan.presentation,
            pages: updatedPages,
         }
      };

      setCurrentPlan(updatedPlan);
      setHasUnsavedChanges(true);

      if (selectedBlock?.id === blockId) {
         setSelectedBlock({
            ...selectedBlock,
            styles: hasStyleProperty
               ? Object.keys(selectedBlock.styles || {}).reduce((acc, key) => {
                  if (key !== styleKey) {
                     (acc as any)[key] = selectedBlock.styles?.[key as keyof BlockStyle];
                  }
                  return acc;
               }, {} as BlockStyle)
               : { ...(selectedBlock.styles || {}), [styleKey]: styleValue } as BlockStyle
         });
      }
   };

   const addNewBlock = (tool: any) => {
      if (!currentPlan || !currentPage) return;

      const newBlock: PageBlock = {
         id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
         type: tool.type,
         content: tool.type === 'heading' ? `New ${tool.name}` :
            tool.type === 'list' ? [] :
               tool.type === 'quote' ? 'Enter your quote here...' :
                  'Add your content here...',
         styles: {
            fontSize: tool.level ? 24 - (tool.level * 2) : 14,
            fontWeight: tool.type === 'heading' ? 'bold' : 'normal',
            color: '#333',
            ...tool.style
         } as BlockStyle,
         metadata: {
            level: tool.level,
            ...(tool.type === 'quote' && { author: 'Author' })
         }
      };

      const updatedPage = {
         ...currentPage,
         blocks: [...currentPage.blocks, newBlock]
      };

      const updatedPages = currentPlan.presentation.pages.map((page, index) => {
         if (index === pageIndex) {
            return updatedPage;
         }
         return page;
      });

      const updatedPlan = {
         ...currentPlan,
         presentation: {
            ...currentPlan.presentation,
            pages: updatedPages,
         }
      };

      setCurrentPlan(updatedPlan);
      setHasUnsavedChanges(true);
      setSelectedBlock(newBlock);

      if (typeof newBlock.content === 'string') {
         setEditingContent(newBlock.content);
      } else if (Array.isArray(newBlock.content)) {
         setEditingContent(JSON.stringify(newBlock.content, null, 2));
      }
   };

   const handleSave = async () => {
      if (!companyId || !currentPlan) {
         Alert.alert('Error', 'No company ID or plan found');
         return;
      }

      if (!hasUnsavedChanges) {
         return;
      }

      setIsSaving(true);

      try {
         const planToSave = {
            ...currentPlan,
            updatedAt: new Date().toISOString()
         };

         await updateCompanyData.mutateAsync({
            companyId,
            data: planToSave
         });

         setHasUnsavedChanges(false);
      } catch (error: any) {
         Alert.alert(
            'Error',
            `Failed to save changes: ${error?.message || 'Unknown error'}`
         );
      } finally {
         setIsSaving(false);
      }
   };

   const handleDone = async (button: "back" | "save") => {
      if (hasUnsavedChanges && companyId) {
         Alert.alert(
            'Unsaved Changes',
            'You have unsaved changes. What would you like to do?',
            [
               {
                  text: 'Discard',
                  style: 'destructive',
                  onPress: () => {
                     if (button === "back") {
                        router.back();
                     }
                  }
               },
               {
                  text: 'Save',
                  onPress: async () => {
                     await handleSave();
                     if (button === "back") {
                        router.back();
                     }
                  }
               },
               {
                  text: 'Cancel',
                  style: 'cancel'
               }
            ]
         );
      } else {
         router.back();
      }
   };

   const renderBlockContent = (block: PageBlock) => {
      switch (block.type) {
         case 'heading':
            return (
               <Text style={[styles.headingText, block.styles]}>
                  {typeof block.content === 'string' ? block.content : 'Heading'}
               </Text>
            );
         case 'paragraph':
            return (
               <Text style={[styles.paragraphText, block.styles]}>
                  {typeof block.content === 'string' ? block.content : 'Paragraph'}
               </Text>
            );
         case 'list':
            const items = Array.isArray(block.content) ? block.content : [];
            return (
               <View style={block.styles}>
                  {items.map((item, index) => (
                     <View key={index} style={styles.listItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={[styles.listText, block.styles]}>{item}</Text>
                     </View>
                  ))}
               </View>
            );
         case 'quote':
            return (
               <View style={[styles.quoteContainer, block.styles]}>
                  <Text style={styles.quoteMark}>"</Text>
                  <Text style={styles.quoteText}>
                     {typeof block.content === 'string' ? block.content : 'Quote'}
                  </Text>
                  {block.metadata?.author && (
                     <Text style={styles.quoteAuthor}>— {block.metadata.author}</Text>
                  )}
               </View>
            );
         case 'divider':
            return <View style={[styles.divider, block.styles]} />;
         case 'image':
            return (
               <View style={[styles.imageContainer, block.styles]}>
                  <Text style={styles.imageText}>
                     {typeof block.content === 'string' ? block.content : 'Image'}
                  </Text>
               </View>
            );
         default:
            return (
               <Text style={[styles.defaultText, block.styles]}>
                  {typeof block.content === 'string' ? block.content : JSON.stringify(block.content)}
               </Text>
            );
      }
   };

   const renderBlock = (block: PageBlock) => {
      const isSelected = selectedBlock?.id === block.id;

      return (
         <View
            key={block.id}
            ref={ref => {
               if (ref) {
                  blockRefs.current.set(block.id, ref);
               } else {
                  blockRefs.current.delete(block.id);
               }
            }}
            collapsable={false}
         >
            <TouchableOpacity
               style={[
                  styles.block,
                  isSelected && styles.selectedBlock
               ]}
               onPress={() => handleBlockSelect(block)}
               activeOpacity={0.7}
            >
               {isSelected ? (
                  <TextInput
                     style={[
                        styles.blockInput,
                        block.type === 'heading' ? styles.headingInput : {},
                        block.type === 'list' ? styles.listInput : {},
                        block.type === 'quote' ? styles.quoteInput : {},
                        block.styles
                     ]}
                     value={editingContent}
                     onChangeText={(text) => {
                        setEditingContent(text);
                        updateBlockContent(block.id, text);
                     }}
                     multiline={block.type !== 'divider' && block.type !== 'image'}
                     autoFocus
                     placeholder={`Edit ${block.type}...`}
                     placeholderTextColor="#999"
                  />
               ) : (
                  renderBlockContent(block)
               )}
            </TouchableOpacity>
         </View>
      );
   };

   if (isLoading || !currentPlan || !currentPage) {
      return (
         <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4D2FB2" />
         </View>
      );
   }

   return (
      <LinearGradient
         colors={["#4D2FB2", "#061E29"]}
         style={{ flex: 1 }}
      >
         <SafeAreaView style={styles.container}>
            <View style={styles.header}>
               <TouchableOpacity onPress={() => handleDone("back")} style={styles.backButton}>
                  <Icon name="arrow-back" size={24} color="#fff" />
               </TouchableOpacity>
               <Text style={styles.headerTitle}>{currentPage.title}</Text>
               <View style={styles.headerRight}>
                  {hasUnsavedChanges && (
                     <View style={styles.unsavedIndicator}>
                        <Text style={styles.unsavedText}>●</Text>
                     </View>
                  )}
                  <TouchableOpacity
                     onPress={() => handleDone("save")}
                     style={styles.doneButton}
                     disabled={isSaving}
                  >
                     {isSaving ? (
                        <ActivityIndicator size="small" color="#fff" />
                     ) : (
                        <Text style={styles.doneButtonText}>{hasUnsavedChanges ? "Save" : "Done"}</Text>
                     )}
                  </TouchableOpacity>
               </View>
            </View>

            <KeyboardAvoidingView
               behavior={Platform.OS === 'ios' ? 'padding' : undefined}
               style={{ flex: 1 }}
            >
               <View style={{ flex: 1 }}>
                  <TouchableWithoutFeedback onPress={handleDeselectBlock}>
                     <View style={{ flex: 1 }}>
                        <ScrollView
                           ref={scrollViewRef}
                           style={styles.contentArea}
                           keyboardShouldPersistTaps="handled"
                           showsVerticalScrollIndicator={true}
                        >
                           <View style={[
                              styles.page,
                              { backgroundColor: currentPage.formatting?.backgroundColor || '#ffffff' }
                           ]}>
                              {currentPage.blocks.map(renderBlock)}

                              <TouchableOpacity
                                 style={styles.addBlockPlaceholder}
                                 onPress={() => addNewBlock({ type: 'paragraph', name: 'Text' })}
                              >
                                 <Icon name="add" size={24} color="#ccc" />
                                 <Text style={styles.addBlockText}>Add new content</Text>
                              </TouchableOpacity>
                           </View>
                        </ScrollView>
                     </View>
                  </TouchableWithoutFeedback>

                  {toolsVisible && (
                     <View style={styles.toolsBar}>
                        <ScrollView
                           horizontal
                           showsHorizontalScrollIndicator={false}
                           keyboardShouldPersistTaps="always"
                        >
                           <View style={styles.toolsContainer}>
                              {editTools.map(tool => {
                                 const isStyleApplied = selectedBlock &&
                                    tool.type === 'style' &&
                                    tool.style &&
                                    Object.keys(tool.style).some(key => {
                                       const styleKey = key as keyof typeof selectedBlock.styles;
                                       return selectedBlock.styles?.hasOwnProperty(styleKey);
                                    });
                                 return (
                                    <TouchableOpacity
                                       key={tool.id}
                                       style={[
                                          styles.toolButton,
                                          isStyleApplied && styles.toolButtonActive
                                       ]}
                                       onPress={() => {
                                          if (selectedBlock) {
                                             if (tool.type === 'style' && tool.style) {
                                                applyStyle(selectedBlock.id, tool.style);
                                             }
                                          } else {
                                             addNewBlock(tool);
                                          }
                                       }}
                                    >
                                       <Icon
                                          name={tool.icon}
                                          size={24}
                                          color={isStyleApplied ? "#FFD700" : "#001941"}
                                       />
                                       <Text style={[
                                          styles.toolLabel,
                                          isStyleApplied && styles.toolLabelActive
                                       ]}>
                                          {tool.name}
                                       </Text>
                                    </TouchableOpacity>
                                 );
                              })}
                           </View>
                        </ScrollView>
                     </View>
                  )}
               </View>
            </KeyboardAvoidingView>

            <TouchableOpacity
               style={styles.toggleToolsButton}
               onPress={() => setToolsVisible(!toolsVisible)}
            >
               <Icon
                  name={toolsVisible ? "keyboard-arrow-down" : "keyboard-arrow-up"}
                  size={24}
                  color="#001941"
               />
            </TouchableOpacity>
         </SafeAreaView>
      </LinearGradient>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
   },
   loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#4D2FB2',
   },
   header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 16,
      zIndex: 10,
   },
   headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
   },
   backButton: {
      padding: 8,
      backgroundColor: "#4D2FB2",
      borderRadius: 100,
   },
   headerTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: 'white',
   },
   unsavedIndicator: {
      marginRight: 4,
   },
   unsavedText: {
      color: '#FFD700',
      fontSize: 16,
   },
   doneButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: '#4D2FB2',
      borderRadius: 6,
      minWidth: 60,
      alignItems: 'center',
   },
   doneButtonText: {
      color: '#ffffff',
      fontWeight: 'bold',
   },
   contentArea: {
      flex: 1,
   },
   page: {
      minHeight: height - 280,
      padding: 30,
      marginHorizontal: 8,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
   },
   block: {
      marginBottom: 20,
      padding: 10,
      borderRadius: 6,
      minHeight: 40,
   },
   selectedBlock: {
      backgroundColor: 'rgba(0, 25, 65, 0.05)',
      borderWidth: 2,
      borderColor: '#001941',
      borderStyle: 'dashed',
   },
   blockInput: {
      fontSize: 14,
      color: '#333',
      padding: 0,
      margin: 0,
      minHeight: 40,
   },
   addBlockPlaceholder: {
      height: 60,
      borderWidth: 2,
      borderColor: '#ccc',
      borderStyle: 'dashed',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
   },
   addBlockText: {
      color: '#ccc',
      marginTop: 5,
   },
   toolsBar: {
      maxHeight: 100,
      paddingVertical: 8,
   },
   toolsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
   },
   toolButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 12,
      backgroundColor: '#f5f5f5',
      borderRadius: 6,
      minWidth: 60,
   },
   toolButtonActive: {
      backgroundColor: 'rgba(0, 25, 65, 0.1)',
      borderWidth: 1,
      borderColor: '#001941',
   },
   toolLabel: {
      fontSize: 11,
      color: '#001941',
      marginTop: 4,
      textAlign: 'center',
   },
   toolLabelActive: {
      color: '#FFD700',
      fontWeight: 'bold',
   },
   toggleToolsButton: {
      position: 'absolute',
      bottom: 110,
      right: 20,
      backgroundColor: '#ffffff',
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
      zIndex: 20,
   },
   headingText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#001941',
      marginBottom: 10,
   },
   paragraphText: {
      fontSize: 14,
      lineHeight: 20,
      color: '#333',
      marginBottom: 15,
   },
   headingInput: {
      fontSize: 24,
      fontWeight: 'bold',
   },
   listInput: {
      fontSize: 14,
   },
   quoteInput: {
      fontSize: 14,
      fontStyle: 'italic',
   },
   listItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 5,
   },
   bullet: {
      marginRight: 8,
      fontSize: 16,
   },
   listText: {
      fontSize: 14,
      lineHeight: 20,
      flex: 1,
   },
   divider: {
      height: 2,
      backgroundColor: '#001941',
      marginVertical: 20,
   },
   imageContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f0f0f0',
      borderRadius: 8,
      padding: 20,
      marginVertical: 15,
   },
   imageText: {
      fontSize: 16,
      color: '#666',
   },
   defaultText: {
      fontSize: 14,
      color: '#333',
   },
   quoteContainer: {
      padding: 16,
      backgroundColor: '#f9f9f9',
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: '#001941',
      marginVertical: 8,
   },
   quoteMark: {
      fontSize: 40,
      color: '#001941',
      opacity: 0.3,
      position: 'absolute',
      top: 5,
      left: 10,
   },
   quoteText: {
      fontSize: 14,
      fontStyle: 'italic',
      color: '#333',
      lineHeight: 20,
      paddingLeft: 20,
   },
   quoteAuthor: {
      fontSize: 12,
      color: '#666',
      marginTop: 8,
      textAlign: 'right',
   },
});