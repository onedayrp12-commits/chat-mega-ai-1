import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GOLD = '#E8BD68';
const API_URL = process.env.EXPO_PUBLIC_API_URL || '';
type Message = { id: string; user: boolean; text: string };

export default function Home() {
  const [value, setValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function send(text = value) {
    const prompt = text.trim();
    if (!prompt || loading) return;
    if (!API_URL) { setError('التطبيق لم يتم ربطه بالخادم بعد. يلزم إعداد عنوان API قبل إصدار APK.'); return; }
    const next = [...messages, { id: `${Date.now()}-u`, user: true, text: prompt }];
    setMessages(next); setValue(''); setError(''); setLoading(true);
    try {
      const response = await fetch(`${API_URL.replace(/\/$/, '')}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, history: messages.slice(-12).map(m => ({ role: m.user ? 'user' : 'model', text: m.text })) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error === 'ai_provider_not_configured' ? 'خدمة الذكاء الاصطناعي غير مهيأة على الخادم.' : (data.message || 'تعذر الاتصال بالخادم.'));
      setMessages([...next, { id: `${Date.now()}-a`, user: false, text: data.answer }]);
    } catch (e) {
      setMessages(next);
      setError(e instanceof Error ? e.message : 'حدث خطأ غير متوقع.');
    } finally { setLoading(false); }
  }

  return <SafeAreaView style={s.root} edges={['top','bottom']}>
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.header}><View><Text style={s.brand}>MeGa <Text style={s.gold}>AI</Text></Text><Text style={s.caption}>YOUR AI WORLD</Text></View><View style={s.online}><View style={s.dot}/><Text style={s.muted}>مساعدك الذكي</Text></View></View>
      <ScrollView style={s.scroll} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {messages.length === 0 ? <View style={s.hero}><Text style={s.star}>✦</Text><Text style={s.title}>عالمك الذكي يبدأ هنا</Text><Text style={s.muted}>اسأل، ابتكر، وتعلّم مع MeGa AI</Text><Text style={s.section}>ابدأ بسؤال</Text>{['اكتب لي إعلاناً احترافياً','اشرح لي الذكاء الاصطناعي','ساعدني في البرمجة','اقترح فكرة مشروع'].map(t=><Pressable key={t} style={s.suggestion} onPress={()=>send(t)}><Text style={s.suggestionText}>{t}</Text><Text style={s.gold}>✧</Text></Pressable>)}</View> : messages.map(m=><View key={m.id} style={[s.msg,m.user?s.user:s.ai]}><Text style={s.msgLabel}>{m.user?'أنت':'MeGa AI'}</Text><Text style={s.msgText}>{m.text}</Text></View>)}
        {loading && <View style={s.loading}><ActivityIndicator color={GOLD}/><Text style={s.gold}>MeGa AI يفكر...</Text></View>}
        {!!error && <Text style={s.error}>{error}</Text>}
      </ScrollView>
      <View style={s.composer}><TextInput value={value} onChangeText={setValue} placeholder="اكتب رسالتك إلى MeGa AI..." placeholderTextColor="#777" multiline style={s.input}/><Pressable style={[s.send,loading&&{opacity:.5}]} disabled={loading} onPress={()=>send()}><Text style={s.sendText}>➤</Text></Pressable></View>
      <Text style={s.footer}>POWERED BY MeGa AI</Text>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:'#090909'},header:{paddingHorizontal:20,paddingVertical:16,borderBottomWidth:1,borderColor:'#292929',flexDirection:'row',justifyContent:'space-between',alignItems:'center'},brand:{fontSize:27,fontWeight:'900',color:'#fff'},caption:{fontSize:9,color:GOLD,letterSpacing:3},gold:{color:GOLD},online:{flexDirection:'row',alignItems:'center',gap:7},dot:{width:8,height:8,borderRadius:8,backgroundColor:'#45C47A'},muted:{color:'#999',marginTop:7},scroll:{flex:1},body:{padding:18,paddingBottom:30},hero:{alignItems:'center',paddingTop:35},star:{fontSize:60,color:GOLD},title:{fontSize:24,color:'#fff',fontWeight:'bold',marginTop:12},section:{alignSelf:'flex-end',color:GOLD,fontWeight:'bold',marginTop:38,marginBottom:14},suggestion:{width:'100%',padding:16,backgroundColor:'#171717',borderColor:'#514326',borderWidth:1,borderRadius:12,marginBottom:10,flexDirection:'row',justifyContent:'space-between'},suggestionText:{color:'#eee'},msg:{padding:14,borderRadius:13,marginBottom:12,maxWidth:'94%'},user:{alignSelf:'flex-start',backgroundColor:'#282319'},ai:{alignSelf:'flex-end',backgroundColor:'#171717',borderWidth:1,borderColor:'#514326'},msgLabel:{color:GOLD,fontWeight:'bold',marginBottom:7},msgText:{color:'#fff',textAlign:'right',lineHeight:24,fontSize:15},loading:{flexDirection:'row',justifyContent:'flex-end',alignItems:'center',gap:10,padding:12},error:{color:'#ff9c9c',textAlign:'right',padding:10},composer:{flexDirection:'row',alignItems:'center',gap:10,padding:12,borderTopWidth:1,borderColor:'#292929'},input:{flex:1,color:'#fff',backgroundColor:'#171717',borderWidth:1,borderColor:'#514326',borderRadius:12,padding:12,textAlign:'right',minHeight:48,maxHeight:110},send:{width:48,height:48,borderRadius:12,backgroundColor:GOLD,alignItems:'center',justifyContent:'center'},sendText:{color:'#17130A',fontSize:23,fontWeight:'bold'},footer:{textAlign:'center',fontSize:9,letterSpacing:2,color:'#555',paddingBottom:5}});
