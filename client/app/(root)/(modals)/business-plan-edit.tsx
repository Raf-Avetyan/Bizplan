import React, { useState, useEffect, useRef } from 'react';
import {
   View,
   Text,
   StyleSheet,
   ScrollView,
   TextInput,
   Dimensions,
   ActivityIndicator,
   KeyboardAvoidingView,
   Platform,
   TouchableWithoutFeedback,
   Keyboard,
   TextStyle,
   ViewStyle,
   Image,
   TouchableOpacity,
   StatusBar,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MotiView, AnimatePresence } from 'moti';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import {
   Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
   Type, Bold, Italic, Underline, List, Image as LucideImage,
   Quote, Minus, AlignLeft, AlignCenter, AlignRight, Trash2,
   PlusCircle, X, Camera, ArrowLeft, Plus, ChevronDown, ChevronUp,
   ArrowUp, ArrowDown, GripVertical,
} from 'lucide-react-native';
import { router, useLocalSearchParams, useRouter } from 'expo-router';
import { PageBlock } from '../(tabs)/(dashboard)/components/Content';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BusinessPlanTemplate } from '@/types/business-plan.types';
import { useActiveCompany, useCompanyAdditionalData, useUpdateCompanyAdditionalData } from '@/hooks/useCompanyQueries';
import { useToast } from '@/components/ui/Toast/Toast';

const { height } = Dimensions.get('window');

type BlockStyle = TextStyle & ViewStyle & { width?: number | string; height?: number | string; };

export default function EditPage() {
   const insets = useSafeAreaInsets();
   const router = useRouter();
   const toast = useToast();
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
   const menuScrollViewRef = useRef<ScrollView>(null);

   const [isListMenuVisible, setIsListMenuVisible] = useState(false);
   const [isImageMenuVisible, setIsImageMenuVisible] = useState(false);
   const [heightInput, setHeightInput] = useState('');
   const [captionInput, setCaptionInput] = useState('');
   const [localListItems, setLocalListItems] = useState<{ id: string; text: string; }[]>([]);

   const openListMenu = () => {
      setIsListMenuVisible(true);
   };

   const openImageMenu = () => {
      setIsImageMenuVisible(true);
   };



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
      { id: 'h1', name: 'H1', icon: Heading1, type: 'heading', level: 1 },
      { id: 'h2', name: 'H2', icon: Heading2, type: 'heading', level: 2 },
      { id: 'h3', name: 'H3', icon: Heading3, type: 'heading', level: 3 },
      { id: 'h4', name: 'H4', icon: Heading4, type: 'heading', level: 4 },
      { id: 'h5', name: 'H5', icon: Heading5, type: 'heading', level: 5 },
      { id: 'h6', name: 'H6', icon: Heading6, type: 'heading', level: 6 },
      { id: 'paragraph', name: 'Text', icon: Type, type: 'paragraph' },
      { id: 'bold', name: 'Bold', icon: Bold, type: 'style', style: { fontWeight: 'bold' } },
      { id: 'italic', name: 'Italic', icon: Italic, type: 'style', style: { fontStyle: 'italic' } },
      { id: 'underline', name: 'Underline', icon: Underline, type: 'style', style: { textDecorationLine: 'underline' } },
      { id: 'list', name: 'List', icon: List, type: 'list' },
      { id: 'image', name: 'Image', icon: LucideImage, type: 'image' },
      { id: 'quote', name: 'Quote', icon: Quote, type: 'quote' },
      { id: 'divider', name: 'Divider', icon: Minus, type: 'divider' },
      { id: 'align-left', name: 'Left', icon: AlignLeft, type: 'style', style: { textAlign: 'left' } },
      { id: 'align-center', name: 'Center', icon: AlignCenter, type: 'style', style: { textAlign: 'center' } },
      { id: 'align-right', name: 'Right', icon: AlignRight, type: 'style', style: { textAlign: 'right' } },
   ];

   const handleBlockSelect = (block: PageBlock) => {
      setSelectedBlock(block);
      if (block.type === 'list') {
         const items = Array.isArray(block.content) ? block.content : [];
         setLocalListItems(items.map((text, i) => ({ id: `item-${i}-${Math.random()}`, text })));
         setEditingContent(JSON.stringify(block.content, null, 2));
         openListMenu();
      } else if (block.type === 'image') {
         setHeightInput(String(block.styles?.height || 200));
         setCaptionInput(block.metadata?.caption || '');
         openImageMenu();
      } else if (typeof block.content === 'string') {
         setEditingContent(block.content);
      } else if (Array.isArray(block.content)) {
         setEditingContent(JSON.stringify(block.content, null, 2));
      } else {
         setEditingContent('');
      }
   };

   const isBlockEmpty = (block: PageBlock): boolean => {
      if (block.type === 'divider') return false;
      if (block.type === 'image') return !block.content;

      const defaultContents = [
         '', 'Add your content here...',
         'New Heading', 'New Subheading', 'New Small Heading',
         `New ${block.type.charAt(0).toUpperCase() + block.type.slice(1)}`,
      ];

      if (typeof block.content === 'string') {
         return defaultContents.includes(block.content.trim());
      }

      if (Array.isArray(block.content)) {
         return block.content.length === 0 || block.content.every(item => item.trim() === '');
      }

      return false;
   };

   const silentDeleteBlock = (blockId: string) => {
      if (!currentPlan || !currentPage) return;

      const updatedBlocks = currentPage.blocks.filter(block => block.id !== blockId);
      const updatedPage = { ...currentPage, blocks: updatedBlocks };
      const updatedPages = currentPlan.presentation.pages.map((page, index) =>
         index === pageIndex ? updatedPage : page
      );
      const updatedPlan = {
         ...currentPlan,
         presentation: { ...currentPlan.presentation, pages: updatedPages },
      };

      setCurrentPlan(updatedPlan);
      setHasUnsavedChanges(true);
   };



   const updateBlockContent = (blockId: string, newContent: string) => {
      if (!currentPlan || !currentPage) return;

      let finalParsedContent: string | string[] = newContent;

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
            finalParsedContent = parsedContent;
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
            content: finalParsedContent
         });
      }
   };

   const updateBlockMetadata = (blockId: string, metadataUpdates: any) => {
      if (!currentPlan || !currentPage) return;

      const updatedBlocks = currentPage.blocks.map(block => {
         if (block.id === blockId) {
            return {
               ...block,
               metadata: {
                  ...block.metadata,
                  ...metadataUpdates
               }
            };
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

      setCurrentPlan({
         ...currentPlan,
         presentation: {
            ...currentPlan.presentation,
            pages: updatedPages,
         }
      });
      setHasUnsavedChanges(true);

      if (selectedBlock?.id === blockId) {
         setSelectedBlock({
            ...selectedBlock,
            metadata: {
               ...selectedBlock.metadata,
               ...metadataUpdates
            }
         });
      }
   };

   const applyStyle = (blockId: string, style: any) => {
      if (!currentPlan || !currentPage) return;

      const updatedBlocks = currentPage.blocks.map(block => {
         if (block.id !== blockId) return block;

         const currentStyles = block.styles || {};
         let isSameValue = true;
         for (const key of Object.keys(style)) {
            if (JSON.stringify(currentStyles[key as keyof BlockStyle]) !== JSON.stringify(style[key])) {
               isSameValue = false;
               break;
            }
         }

         let newStyles: any = { ...currentStyles };
         if (isSameValue) {
            for (const key of Object.keys(style)) {
               if (key === 'fontWeight') {
                  newStyles[key] = '400';
               } else if (key === 'fontStyle') {
                  newStyles[key] = 'normal';
               } else if (key === 'textDecorationLine') {
                  newStyles[key] = 'none';
               } else {
                  delete newStyles[key];
               }
            }
         } else {
            newStyles = { ...currentStyles, ...style };
         }

         return { ...block, styles: newStyles as BlockStyle };
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
         const currentStyles = selectedBlock.styles || {};
         let isSameValue = true;
         for (const key of Object.keys(style)) {
            if (JSON.stringify(currentStyles[key as keyof BlockStyle]) !== JSON.stringify(style[key])) {
               isSameValue = false;
               break;
            }
         }

         let finalStyles: any = { ...currentStyles };
         if (isSameValue) {
            for (const key of Object.keys(style)) {
               if (key === 'fontWeight') {
                  finalStyles[key] = '400';
               } else if (key === 'fontStyle') {
                  finalStyles[key] = 'normal';
               } else if (key === 'textDecorationLine') {
                  finalStyles[key] = 'none';
               } else {
                  delete finalStyles[key];
               }
            }
         } else {
            finalStyles = { ...currentStyles, ...style };
         }

         setSelectedBlock({
            ...selectedBlock,
            styles: finalStyles as BlockStyle
         });
      }
   };

   const addNewBlock = (tool: any, initialContent?: any) => {
      if (!currentPlan || !currentPage) return;

      const newBlock: PageBlock = {
         id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
         type: tool.type,
         content: initialContent || (
            tool.type === 'heading' ? `New ${tool.name}` :
               tool.type === 'list' ? [''] :
                  tool.type === 'quote' ? '' :
                     tool.type === 'divider' ? '' :
                        'Add your content here...'
         ),
         styles: {
            fontSize: tool.level ? 24 - (tool.level * 2) : 14,
            fontWeight: tool.type === 'heading' ? 'bold' : 'normal',
            color: '#333',
            ...(tool.type === 'image' && { width: '100%', height: 200 }),
            ...tool.style
         } as BlockStyle,
         metadata: {
            level: tool.level,
            ...(tool.type === 'quote' && { author: '' })
         }
      };

      // Insert after selected block if one is selected, otherwise append to end
      let newBlocks;
      if (selectedBlock) {
         const selectedIndex = currentPage.blocks.findIndex(b => b.id === selectedBlock.id);
         newBlocks = [
            ...currentPage.blocks.slice(0, selectedIndex + 1),
            newBlock,
            ...currentPage.blocks.slice(selectedIndex + 1)
         ];
      } else {
         newBlocks = [...currentPage.blocks, newBlock];
      }

      const updatedPage = {
         ...currentPage,
         blocks: newBlocks
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

      if (tool.type !== 'divider') {
         setSelectedBlock(newBlock);
      } else {
         setSelectedBlock(null);
      }

      if (typeof newBlock.content === 'string' && tool.type !== 'divider') {
         setEditingContent(newBlock.content);
      } else if (Array.isArray(newBlock.content)) {
         setEditingContent(JSON.stringify(newBlock.content, null, 2));
         if (newBlock.type === 'list') {
            openListMenu();
         }
      }
   };

   const moveBlock = (blockId: string, direction: 'up' | 'down') => {
      if (!currentPlan || !currentPage) return;

      const blocks = [...currentPage.blocks];
      const index = blocks.findIndex(b => b.id === blockId);
      if (index === -1) return;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= blocks.length) return;

      [blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];

      const updatedPage = { ...currentPage, blocks };
      const updatedPages = currentPlan.presentation.pages.map((page, i) =>
         i === pageIndex ? updatedPage : page
      );
      const updatedPlan = {
         ...currentPlan,
         presentation: { ...currentPlan.presentation, pages: updatedPages },
      };

      setCurrentPlan(updatedPlan);
      setHasUnsavedChanges(true);
   };

   const deleteBlock = (blockId: string) => {
      if (!currentPlan || !currentPage) return;

      Keyboard.dismiss();
      toast.showConfirm(
         "Delete Block",
         "Are you sure you want to delete this block?",
         () => {
            const updatedBlocks = currentPage.blocks.filter(block => block.id !== blockId);

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
            handleDeselectBlock(true);
         },
         { confirmText: 'Delete', cancelText: 'Cancel', type: 'error' }
      );
   };

   const pickImage = async (blockId?: string) => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
         toast.showToast('Permission Denied', 'Sorry, we need camera roll permissions to make this work!', 'warning');
         return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
         mediaTypes: ImagePicker.MediaTypeOptions.Images,
         allowsEditing: true,
         aspect: [16, 9],
         quality: 1,
      });

      if (!result.canceled) {
         const imageUri = result.assets[0].uri;
         if (blockId) {
            updateBlockContent(blockId, imageUri);
         } else {
            addNewBlock({ type: 'image', name: 'Image' }, imageUri);
         }
      }
   };

   const updateListItem = (index: number, text: string) => {
      if (!selectedBlock) return;
      const newList = [...localListItems];
      newList[index] = { ...newList[index], text };
      setLocalListItems(newList);
   };

   const flushListUpdate = () => {
      if (!selectedBlock) return;
      updateBlockContent(selectedBlock.id, JSON.stringify(localListItems.map(i => i.text)));
   };

   const addListItem = () => {
      if (!selectedBlock) return;
      const newItem = { id: `item-${Date.now()}-${Math.random()}`, text: '' };
      const newList = [...localListItems, newItem];
      setLocalListItems(newList);
      updateBlockContent(selectedBlock.id, JSON.stringify(newList.map(i => i.text)));
   };

   const removeListItem = (index: number) => {
      if (!selectedBlock) return;
      const newList = localListItems.filter((_, i) => i !== index);

      if (newList.length === 0) {
         silentDeleteBlock(selectedBlock.id);
         handleDeselectBlock();
         return;
      }

      setLocalListItems(newList);
      updateBlockContent(selectedBlock.id, JSON.stringify(newList.map(i => i.text)));
   };

   const reorderListItems = (data: { id: string; text: string; }[]) => {
      if (!selectedBlock) return;
      setLocalListItems(data);
      updateBlockContent(selectedBlock.id, JSON.stringify(data.map(i => i.text)));
   };

   const setBlockStyle = (blockId: string, style: any) => {
      if (!currentPlan || !currentPage) return;

      const updatedBlocks = currentPage.blocks.map(block => {
         if (block.id !== blockId) return block;
         return { ...block, styles: { ...block.styles, ...style } as BlockStyle };
      });

      const updatedPage = { ...currentPage, blocks: updatedBlocks };
      const updatedPages = currentPlan.presentation.pages.map((page, i) =>
         i === pageIndex ? updatedPage : page
      );
      const updatedPlan = {
         ...currentPlan,
         presentation: { ...currentPlan.presentation, pages: updatedPages },
      };

      setCurrentPlan(updatedPlan);
      setHasUnsavedChanges(true);

      if (selectedBlock?.id === blockId) {
         setSelectedBlock({ ...selectedBlock, styles: { ...selectedBlock.styles, ...style } as BlockStyle });
      }
   };

   const flushPendingChanges = () => {
      if (!selectedBlock) return;

      if (selectedBlock.type === 'image') {
         // Flush height
         let v = parseInt(heightInput);
         if (!isNaN(v)) {
            const clampedVal = Math.min(600, Math.max(40, v));
            setBlockStyle(selectedBlock.id, { height: clampedVal });
         }
         // Flush caption
         updateBlockMetadata(selectedBlock.id, { caption: captionInput });
      } else if (selectedBlock.type === 'list') {
         // Flush list items
         flushListUpdate();
      }
   };

   const closeListMenu = () => {
      Keyboard.dismiss();
      flushPendingChanges();
      setIsListMenuVisible(false);
      setSelectedBlock(null);
   };

   const closeImageMenu = () => {
      Keyboard.dismiss();
      flushPendingChanges();
      setIsImageMenuVisible(false);
      setSelectedBlock(null);
   };

   const handleDeselectBlock = (skipFlush: boolean = false) => {
      if (selectedBlock && !skipFlush) {
         flushPendingChanges();
         if (isBlockEmpty(selectedBlock)) {
            silentDeleteBlock(selectedBlock.id);
         }
      }

      setSelectedBlock(null);
      setEditingContent('');
      setIsListMenuVisible(false);
      setIsImageMenuVisible(false);
      Keyboard.dismiss();
   };

   const handleSave = async () => {
      if (!companyId || !currentPlan) {
         toast.showToast('Error', 'No company ID or plan found', 'error');
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
         toast.showToast(
            'Error',
            `Failed to save changes: ${error?.message || 'Unknown error'}`,
            'error'
         );
      } finally {
         setIsSaving(false);
      }
   };

   const handleDone = async (button: "back" | "save") => {
      Keyboard.dismiss();
      if (hasUnsavedChanges && companyId) {
         toast.showConfirm(
            'Unsaved Changes',
            'Save your changes before leaving?',
            async () => {
               await handleSave();
               if (button === "back") {
                  router.back();
               } else {
                  toast.showToast('Saved', 'Your changes have been saved.', 'success');
               }
            },
            {
               confirmText: 'Save',
               cancelText: 'Discard',
               type: 'warning',
               onCancel: () => {
                  if (button === "save") {
                     if (companyAdditionalData?.business_plan) {
                        setCurrentPlan(companyAdditionalData.business_plan as BusinessPlanTemplate);
                        setHasUnsavedChanges(false);
                        handleDeselectBlock(true);
                        toast.showToast('Discarded', 'Changes have been reset to the last saved version.', 'info');
                     }
                  } else {
                     // If clicking Back button then discard, go back
                     router.back();
                  }
               },
            }
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
                     {typeof block.content === 'string' && block.content ? block.content : ''}
                  </Text>
                  {!block.content && (
                     <Text style={[styles.quoteText, { color: '#999' }]}>Enter your quote here...</Text>
                  )}
                  <Text style={styles.quoteAuthor}>— {block.metadata?.author || 'Author'}</Text>
               </View>
            );
         case 'divider':
            return <View style={[styles.divider, block.styles]} />;
         case 'image':
            const hasImage = typeof block.content === 'string' && (
               block.content.startsWith('http') ||
               block.content.startsWith('file') ||
               block.content.startsWith('content') ||
               block.content.startsWith('data:image')
            );
            const edBR = Number(block.styles?.borderRadius) || 0;
            const edRM = (block.metadata?.resizeMode || 'cover') as 'cover' | 'contain' | 'stretch';
            const edBS = block.metadata?.borderStyle || 'none';
            const edCap = block.metadata?.caption || '';
            const edFrame: any = edBS === 'thin' ? { borderWidth: 1, borderColor: '#ddd' }
               : edBS === 'medium' ? { borderWidth: 2, borderColor: '#999' }
                  : edBS === 'shadow' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 }
                     : {};
            return (
               <View>
                  <View style={[styles.imageContainer, block.styles, { height: block.styles?.height || 200, padding: 0, borderRadius: edBR === 999 ? Number(block.styles?.height || 200) : edBR, overflow: 'hidden' }, edFrame]}>
                     {hasImage ? (
                        <Image
                           source={{ uri: block.content as string }}
                           style={[styles.blockImage, { width: '100%', height: '100%' }]}
                           resizeMode={edRM}
                        />
                     ) : (
                        <View style={styles.imagePlaceholder}>
                           <LucideImage size={48} color="#ccc" />
                           <Text style={styles.imageText}>
                              {typeof block.content === 'string' ? block.content : 'Image'}
                           </Text>
                        </View>
                     )}
                  </View>
                  {edCap ? <Text style={{ fontSize: 11, color: '#888', textAlign: 'center', marginTop: 4, fontStyle: 'italic' }}>{edCap}</Text> : null}
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
               {isSelected && block.type !== 'list' && block.type !== 'image' && block.type !== 'divider' ? (
                  block.type === 'quote' ? (
                     <View style={[styles.quoteContainer, block.styles, { marginVertical: 0 }]}>
                        <Text style={styles.quoteMark}>"</Text>
                        <TextInput
                           style={[styles.blockInput, styles.quoteInput, { flex: 1, marginLeft: 20 }]}
                           value={editingContent}
                           onChangeText={(text) => {
                              setEditingContent(text);
                              updateBlockContent(block.id, text);
                           }}
                           multiline
                           autoFocus
                           placeholder="Enter your quote here..."
                           placeholderTextColor="#999"
                        />
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, justifyContent: 'flex-end' }}>
                           <Text style={{ color: '#666', marginRight: 5 }}>—</Text>
                           <TextInput
                              style={{ color: '#666', fontSize: 14, minWidth: 80, textAlign: 'right' }}
                              value={block.metadata?.author || ''}
                              onChangeText={(text) => {
                                 updateBlockMetadata(block.id, { author: text });
                              }}
                              placeholder="Author"
                              placeholderTextColor="#999"
                           />
                        </View>
                     </View>
                  ) : (
                     <TextInput
                        style={[
                           styles.blockInput,
                           block.type === 'heading' ? styles.headingInput : {},
                           block.styles
                        ]}
                        value={editingContent}
                        onChangeText={(text) => {
                           setEditingContent(text);
                           updateBlockContent(block.id, text);
                        }}
                        multiline
                        autoFocus
                        placeholder={`Edit ${block.type}...`}
                        placeholderTextColor="#999"
                     />
                  )
               ) : (
                  renderBlockContent(block)
               )}
            </TouchableOpacity>
         </View>
      );
   };

   const renderListEditMenu = () => {
      if (!selectedBlock || selectedBlock.type !== 'list') return null;

      const items = Array.isArray(selectedBlock.content) ? selectedBlock.content : [];

      return (
         <MotiView
            from={{ translateX: Dimensions.get('window').width, opacity: 0 }}
            animate={{ translateX: 0, opacity: 1 }}
            exit={{ translateX: Dimensions.get('window').width, opacity: 0 }}
            transition={{
               type: 'timing',
               duration: 350,
            }}
            style={styles.listMenu}
         >
            <LinearGradient
               colors={["#4D2FB2", "#2B1A66", "#050510"]}
               style={{ flex: 1, paddingTop: insets.top }}
               start={{ x: 0.5, y: 0 }}
               end={{ x: 0.5, y: 1 }}
               locations={[0, 0.6, 1]}
            >
               <View style={styles.listMenuContent}>
                  <View style={styles.listMenuHeader}>
                     <Text style={styles.listMenuTitle}>Edit List Items</Text>
                     <TouchableOpacity onPress={closeListMenu} style={styles.closeMenuButton}>
                        <X size={24} color="#FFFFFF" />
                     </TouchableOpacity>
                  </View>

                  <DraggableFlatList
                     data={localListItems}
                     keyExtractor={(item) => item.id}
                     onDragEnd={({ data }) => reorderListItems(data)}
                     containerStyle={styles.listMenuItemsContainer}
                     renderItem={({ item, getIndex, drag, isActive }: RenderItemParams<{ id: string; text: string; }>) => {
                        const index = getIndex() ?? 0;
                        return (
                           <View
                              style={[
                                 styles.listMenuInputItem,
                                 isActive && {
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    borderColor: 'rgba(255, 255, 255, 0.4)',
                                    shadowColor: '#fff',
                                    shadowOpacity: 0.15,
                                    shadowRadius: 10,
                                    elevation: 8,
                                 }
                              ]}
                           >
                              <TouchableOpacity onLongPress={drag} delayLongPress={100} style={{ padding: 6, marginRight: 4 }}>
                                 <GripVertical size={16} color="rgba(255, 255, 255, 0.4)" />
                              </TouchableOpacity>
                              <Text style={styles.itemNumber}>{index + 1}.</Text>
                              <TextInput
                                 style={styles.listItemInput}
                                 value={item.text}
                                 onChangeText={(text) => updateListItem(index, text)}
                                 onEndEditing={flushListUpdate}
                                 multiline
                                 placeholder="List item content..."
                                 placeholderTextColor="rgba(255,255,255,0.3)"
                              />
                              <TouchableOpacity
                                 onPress={() => removeListItem(index)}
                                 style={styles.removeItemButton}
                              >
                                 <Trash2 size={20} color="rgba(239, 68, 68, 0.8)" />
                              </TouchableOpacity>
                           </View>
                        );
                     }}
                  />

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                     <TouchableOpacity style={[styles.addItemButton, { flex: 1 }]} onPress={addListItem}>
                        <PlusCircle size={20} color="whitesmoke" />
                        <Text style={styles.addItemButtonText}>Add Item</Text>
                     </TouchableOpacity>
                     <TouchableOpacity
                        style={[styles.addItemButton, { flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}
                        onPress={() => deleteBlock(selectedBlock.id)}
                     >
                        <Trash2 size={20} color="whitesmoke" />
                        <Text style={styles.addItemButtonText}>Delete List</Text>
                     </TouchableOpacity>
                  </View>
               </View>
            </LinearGradient>
         </MotiView >
      );
   };

   const renderImageEditMenu = () => {
      if (!selectedBlock || selectedBlock.type !== 'image') return null;

      const currentHeight = Number(selectedBlock.styles?.height) || 200;
      const currentBorderRadius = Number(selectedBlock.styles?.borderRadius) || 0;
      const currentResizeMode = selectedBlock.metadata?.resizeMode || 'cover';
      const currentCaption = selectedBlock.metadata?.caption || '';

      const sizePresets = [
         { label: 'Banner', h: 120 },
         { label: 'Square', h: 300 },
         { label: 'Portrait', h: 400 },
         { label: 'Landscape', h: 180 },
      ];

      const radiusPresets = [
         { label: 'None', val: 0 },
         { label: 'S', val: 8 },
         { label: 'M', val: 16 },
         { label: 'L', val: 24 },
         { label: '\u25CF', val: 999 },
      ];

      const resizeModes = ['cover', 'contain', 'stretch'];

      return (
         <MotiView
            from={{ translateX: Dimensions.get('window').width, opacity: 0 }}
            animate={{ translateX: 0, opacity: 1 }}
            exit={{ translateX: Dimensions.get('window').width, opacity: 0 }}
            transition={{ type: 'timing', duration: 350 }}
            style={styles.listMenu}
         >
            <LinearGradient
               colors={["#4D2FB2", "#2B1A66", "#050510"]}
               style={{ flex: 1, paddingTop: insets.top }}
               start={{ x: 0.5, y: 0 }}
               end={{ x: 0.5, y: 1 }}
               locations={[0, 0.6, 1]}
            >
               <View style={styles.listMenuContent}>
                  <View style={styles.listMenuHeader}>
                     <Text style={styles.listMenuTitle}>Edit Image</Text>
                     <TouchableOpacity onPress={closeImageMenu} style={styles.closeMenuButton}>
                        <X size={24} color="#FFFFFF" />
                     </TouchableOpacity>
                  </View>

                  <ScrollView
                     ref={menuScrollViewRef}
                     style={styles.listMenuItemsContainer}
                     showsVerticalScrollIndicator={false}
                  >
                     {/* Image Preview */}
                     <View style={[styles.imagePreviewContainer, { minHeight: undefined }]}>
                        <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                           <MotiView
                              animate={{ height: currentHeight }}
                              transition={{ type: 'timing', duration: 250 }}
                              style={{ width: '100%', borderRadius: currentBorderRadius === 999 ? 999 : currentBorderRadius, overflow: 'hidden' }}
                           >
                              <Image
                                 source={{ uri: selectedBlock.content as string }}
                                 style={{ width: '100%', height: '100%' }}
                                 resizeMode={currentResizeMode as any}
                              />
                           </MotiView>
                        </View>
                        <TouchableOpacity style={styles.deleteImageButton} onPress={() => deleteBlock(selectedBlock.id)}>
                           <Trash2 size={18} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.changeImageButton} onPress={() => pickImage(selectedBlock.id)}>
                           <Camera size={20} color="white" />
                           <Text style={styles.changeImageText}>Change</Text>
                        </TouchableOpacity>
                     </View>

                     {/* Height Control */}
                     <View style={styles.imgCtrlSection}>
                        <Text style={styles.imgCtrlLabel}>Height</Text>
                        <View style={styles.imgCtrlRow}>
                           <TouchableOpacity style={styles.imgCtrlBtn} onPress={() => {
                              const v = Math.max(40, currentHeight - 20);
                              setBlockStyle(selectedBlock.id, { height: v });
                              setHeightInput(String(v));
                           }}>
                              <Minus size={16} color="#fff" />
                           </TouchableOpacity>
                           <View style={styles.imgInputWrap}>
                              <TextInput
                                 style={styles.imgDimensionInput}
                                 value={heightInput}
                                 onChangeText={setHeightInput}
                                 onEndEditing={() => {
                                    if (!heightInput.trim()) {
                                       setHeightInput(String(selectedBlock.styles?.height || 200));
                                       return;
                                    }
                                    let valInput = parseInt(heightInput);
                                    if (isNaN(valInput)) {
                                       setHeightInput(String(selectedBlock.styles?.height || 200));
                                       return;
                                    }
                                    const clampedVal = Math.min(600, Math.max(40, valInput));
                                    setHeightInput(String(clampedVal));
                                    setBlockStyle(selectedBlock.id, { height: clampedVal });
                                 }}
                                 keyboardType="numeric"
                                 selectTextOnFocus
                                 returnKeyType="done"
                              />
                              <Text style={styles.imgDimensionUnit}>px</Text>
                           </View>
                           <TouchableOpacity style={styles.imgCtrlBtn} onPress={() => {
                              const v = Math.min(600, currentHeight + 20);
                              setBlockStyle(selectedBlock.id, { height: v });
                              setHeightInput(String(v));
                           }}>
                              <Plus size={16} color="#fff" />
                           </TouchableOpacity>
                        </View>
                     </View>

                     {/* Size Presets */}
                     <View style={styles.imgCtrlSection}>
                        <Text style={styles.imgCtrlLabel}>Size Presets</Text>
                        <View style={styles.imgPresetRow}>
                           {sizePresets.map(p => (
                              <TouchableOpacity
                                 key={p.label}
                                 style={[styles.imgPresetBtn, currentHeight === p.h && styles.imgPresetBtnActive]}
                                 onPress={() => {
                                    setBlockStyle(selectedBlock.id, { height: p.h });
                                    setHeightInput(String(p.h));
                                 }}
                              >
                                 <Text style={[styles.imgPresetText, currentHeight === p.h && styles.imgPresetTextActive]}>{p.label}</Text>
                              </TouchableOpacity>
                           ))}
                        </View>
                     </View>

                     {/* Border Radius */}
                     <View style={styles.imgCtrlSection}>
                        <Text style={styles.imgCtrlLabel}>Corner Radius</Text>
                        <View style={styles.imgPresetRow}>
                           {radiusPresets.map(p => (
                              <TouchableOpacity key={p.label} style={[styles.imgPresetBtn, currentBorderRadius === p.val && styles.imgPresetBtnActive]} onPress={() => setBlockStyle(selectedBlock.id, { borderRadius: p.val })}>
                                 <Text style={[styles.imgPresetText, currentBorderRadius === p.val && styles.imgPresetTextActive]}>{p.label}</Text>
                              </TouchableOpacity>
                           ))}
                        </View>
                     </View>

                     {/* Resize Mode */}
                     <View style={styles.imgCtrlSection}>
                        <Text style={styles.imgCtrlLabel}>Display Mode</Text>
                        <View style={styles.imgPresetRow}>
                           {resizeModes.map(m => (
                              <TouchableOpacity key={m} style={[styles.imgPresetBtn, { flex: 1 }, currentResizeMode === m && styles.imgPresetBtnActive]} onPress={() => updateBlockMetadata(selectedBlock.id, { resizeMode: m })}>
                                 <Text style={[styles.imgPresetText, currentResizeMode === m && styles.imgPresetTextActive]}>{m.charAt(0).toUpperCase() + m.slice(1)}</Text>
                              </TouchableOpacity>
                           ))}
                        </View>
                     </View>

                     {/* Caption */}
                     <View style={styles.imgCtrlSection}>
                        <Text style={styles.imgCtrlLabel}>Caption</Text>
                        <TextInput
                           style={styles.imgCaptionInput}
                           value={captionInput}
                           onChangeText={setCaptionInput}
                           onFocus={() => {
                              setTimeout(() => menuScrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                           }}
                           onBlur={() => {
                              menuScrollViewRef.current?.scrollTo({ y: 0, animated: true });
                           }}
                           onEndEditing={() => updateBlockMetadata(selectedBlock.id, { caption: captionInput })}
                           placeholder="Add a caption..."
                           placeholderTextColor="rgba(255,255,255,0.3)"
                           multiline
                           returnKeyType="done"
                           blurOnSubmit={true}
                        />
                     </View>

                     <View style={{ height: 350 }} />
                  </ScrollView>
               </View>
            </LinearGradient>
         </MotiView>
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
      <>
         <LinearGradient
            colors={["#4D2FB2", "#2B1A66", "#050510"]}
            style={{ flex: 1 }}
            locations={[0, 0.6, 1]}
         >
            <SafeAreaView style={styles.container}>
               <View style={styles.header}>
                  <TouchableOpacity onPress={() => handleDone("back")} style={styles.backButton}>
                     <ArrowLeft size={20} color="#fff" />
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
                     <TouchableWithoutFeedback onPress={() => handleDeselectBlock()}>
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
                                    <Plus size={20} color="rgba(0, 25, 65, 0.25)" />
                                    <Text style={styles.addBlockText}>Tap to add content</Text>
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
                                 {(selectedBlock ? [
                                    { id: 'delete', name: 'Delete', icon: Trash2, type: 'delete' },
                                    { id: 'move-up', name: 'Up', icon: ArrowUp, type: 'move', direction: 'up' },
                                    { id: 'move-down', name: 'Down', icon: ArrowDown, type: 'move', direction: 'down' },
                                    ...editTools
                                 ] : editTools).map(tool => {
                                    const isStyleApplied = selectedBlock &&
                                       tool.type === 'style' &&
                                       (tool as any).style &&
                                       Object.keys((tool as any).style).every(key => {
                                          if (!selectedBlock.styles) return false;
                                          const currentVal = selectedBlock.styles[key as keyof BlockStyle];
                                          const toolVal = ((tool as any).style as any)[key];
                                          if (key === 'fontWeight') {
                                             return currentVal === toolVal || currentVal === '700';
                                          }
                                          return currentVal === toolVal;
                                       });
                                    return (
                                       <TouchableOpacity
                                          key={tool.id}
                                          style={[
                                             styles.toolButton,
                                             isStyleApplied && styles.toolButtonActive,
                                             tool.id === 'delete' && { backgroundColor: 'rgba(239, 68, 68, 0.98)' }
                                          ]}
                                          onPress={() => {
                                             if (tool.id === 'delete' && selectedBlock) {
                                                deleteBlock(selectedBlock.id);
                                             } else if (tool.type === 'move' && selectedBlock) {
                                                moveBlock(selectedBlock.id, (tool as any).direction);
                                             } else if (tool.type === 'image') {
                                                pickImage(selectedBlock?.type === 'image' ? selectedBlock.id : undefined);
                                             } else if (selectedBlock) {
                                                if (tool.type === 'style' && (tool as any).style) {
                                                   applyStyle(selectedBlock.id, (tool as any).style);
                                                } else if (tool.type === 'list' && selectedBlock.type === 'list') {
                                                   openListMenu();
                                                } else {
                                                   addNewBlock(tool);
                                                }
                                             } else {
                                                addNewBlock(tool);
                                             }
                                          }}
                                       >
                                          <tool.icon
                                             size={24}
                                             color={(tool.id === 'delete') ? "white" : isStyleApplied ? "#000000" : "rgba(255, 255, 255, 0.75)"}
                                          />
                                          <Text style={[
                                             styles.toolLabel,
                                             isStyleApplied && styles.toolLabelActive,
                                             (tool.type === 'delete') && {
                                                color: "white"
                                             }
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
                  {toolsVisible ? (
                     <ChevronDown size={24} color="#001941" />
                  ) : (
                     <ChevronUp size={24} color="#001941" />
                  )}
               </TouchableOpacity>
            </SafeAreaView>
         </LinearGradient>
         <AnimatePresence>
            {(isListMenuVisible || isImageMenuVisible) && (
               <>
                  <TouchableWithoutFeedback onPress={isListMenuVisible ? closeListMenu : closeImageMenu}>
                     <MotiView
                        from={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'timing', duration: 350 }}
                        style={styles.menuOverlay}
                     />
                  </TouchableWithoutFeedback>
                  {isListMenuVisible && renderListEditMenu()}
                  {isImageMenuVisible && renderImageEditMenu()}
               </>
            )}
         </AnimatePresence>
      </>
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
      paddingHorizontal: 18,
      paddingBottom: 12,
      zIndex: 10,
   },
   headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
   },
   backButton: {
      padding: 8,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderRadius: 11,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
   },
   headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: 'white',
      letterSpacing: 0.3,
   },
   unsavedIndicator: {
      marginRight: 4,
   },
   unsavedText: {
      color: '#A855F7',
      fontSize: 12,
   },
   doneButton: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      borderRadius: 11,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
      minWidth: 64,
      alignItems: 'center',
   },
   doneButtonText: {
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: 13,
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
      borderWidth: 2,
      borderColor: 'transparent',
      borderStyle: 'dashed',
   },
   selectedBlock: {
      backgroundColor: 'rgba(0, 25, 65, 0.05)',
      borderColor: '#001941',
   },
   blockInput: {
      fontSize: 14,
      color: '#333',
      padding: 0,
      margin: 0,
      minHeight: 40,
   },
   addBlockPlaceholder: {
      height: 70,
      borderWidth: 1.5,
      borderColor: 'rgba(0, 25, 65, 0.1)',
      borderStyle: 'dashed',
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      marginTop: 20,
      backgroundColor: 'rgba(0, 25, 65, 0.02)',
      gap: 8,
   },
   addBlockText: {
      color: 'rgba(0, 25, 65, 0.25)',
      fontSize: 13,
      fontWeight: '600',
      textTransform: "uppercase",
   },
   toolsBar: {
      maxHeight: 110,
      paddingVertical: 8,
   },
   toolsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
   },
   toolButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginRight: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 14,
      minWidth: 68,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.04)',
   },
   toolButtonActive: {
      backgroundColor: '#FFFFFF',
      borderColor: '#FFFFFF',
      borderWidth: 1.5,
      shadowColor: '#FFFFFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
   },
   toolLabel: {
      fontSize: 10,
      color: 'rgba(255, 255, 255, 0.55)',
      marginTop: 6,
      textAlign: 'center',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
   },
   toolLabelActive: {
      color: '#000000',
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
      marginVertical: 15,
      overflow: 'hidden',
   },
   imagePlaceholder: {
      alignItems: 'center',
      padding: 20,
   },
   blockImage: {
      borderRadius: 8,
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
   listMenu: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      borderTopLeftRadius: 20,
      borderBottomLeftRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: -4, height: 0 },
      shadowOpacity: 0.2,
      elevation: 20,
      zIndex: 1000,
   },
   listMenuContent: {
      flex: 1,
      paddingHorizontal: 20,
   },
   menuOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 999,
   },
   listMenuHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
   },
   listMenuTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
   },
   closeMenuButton: {
      padding: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: "50%",
   },
   listMenuItemsContainer: {
      flex: 1,
   },
   listMenuInputItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      padding: 10,
   },
   itemNumber: {
      fontSize: 14,
      fontWeight: 'bold',
      color: 'whitesmoke',
      width: 25,
   },
   listItemInput: {
      flex: 1,
      fontSize: 12,
      color: 'whitesmoke',
      padding: 0,
   },
   removeItemButton: {
      padding: 5,
      marginLeft: 5,
   },
   addItemButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 15,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      marginTop: 10,
      marginBottom: 30,
   },
   addItemButtonText: {
      marginLeft: 8,
      color: 'whitesmoke',
      fontWeight: 'bold',
   },
   imagePreviewContainer: {
      width: '100%',
      minHeight: 180,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      padding: 14,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 20,
      position: 'relative',
   },
   imageMenuPreview: {
      width: '100%',
      height: '100%',
      borderRadius: 8,
   },
   changeImageButton: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      backgroundColor: 'rgba(0, 0, 0, .7)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
   },
   deleteImageButton: {
      position: 'absolute',
      top: 6,
      right: 6,
      backgroundColor: 'rgba(239, 68, 68)',
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
   },
   changeImageText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
      marginLeft: 6,
   },
   imageSizeControls: {
      padding: 15,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 12,
   },
   controlLabel: {
      color: 'whitesmoke',
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 12,
   },
   sizeSliderContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
   },
   sizeAdjustButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'whitesmoke',
      justifyContent: 'center',
      alignItems: 'center',
   },
   sizeValueText: {
      color: 'whitesmoke',
      fontSize: 18,
      fontWeight: 'bold',
   },
   layoutOptions: {
      flexDirection: 'row',
      gap: 10,
   },
   layoutOption: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
   },
   layoutOptionActive: {
      backgroundColor: '#FFD700',
      borderColor: '#FFD700',
   },
   layoutOptionText: {
      color: 'whitesmoke',
      fontWeight: '600',
   },
   layoutOptionTextActive: {
      color: '#001941',
   },
   // Image Edit Menu Controls
   imgCtrlSection: {
      marginTop: 16,
   },
   imgCtrlLabel: {
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
   },
   imgCtrlRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
   },
   imgCtrlBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
   },
   imgCtrlValue: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      minWidth: 60,
      textAlign: 'center',
   },
   imgInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
      paddingHorizontal: 10,
      minWidth: 80,
   },
   imgDimensionInput: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'center',
      paddingVertical: 6,
      minWidth: 40,
   },
   imgDimensionUnit: {
      color: 'rgba(255, 255, 255, 0.4)',
      fontSize: 13,
      fontWeight: '600',
      marginLeft: 2,
   },
   imgPresetRow: {
      flexDirection: 'row',
      gap: 8,
   },
   imgPresetBtn: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      alignItems: 'center',
   },
   imgPresetBtnActive: {
      backgroundColor: 'rgba(255, 215, 0, 0.2)',
      borderColor: '#FFD700',
   },
   imgPresetText: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: 13,
      fontWeight: '600',
   },
   imgPresetTextActive: {
      color: '#FFD700',
   },
   imgCaptionInput: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: '#FFFFFF',
      fontSize: 14,
      minHeight: 50,
   },
});