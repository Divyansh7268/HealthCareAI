import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { COLORS as THEME_COLORS, FONTS as THEME_FONTS, RADIUS, SHADOW, SPACING } from '../theme';
import BodyMap from '../components/BodyMap/BodyMap';
import { updateVisitData } from '../services/patientService';
import { analyzeVisit, uploadFile, transcribeAudio } from '../api/visitApi';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { computeOfflineAssessment } from '../clinical/offlineAssessment';
import { saveOfflineAssessment } from '../storage/repositories/assessmentRepo';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────────────────────
const COLORS = {
  ...THEME_COLORS,
  primary: '#E11D48',
  primaryLight: '#FFF1F2',
  textDark: '#1E293B',
  textGray: '#64748B',
  bg: '#FAFAFA',
  white: '#FFFFFF',
  border: '#E2E8F0',
  inputBg: '#FFFFFF',
};

const FONTS = {
  ...THEME_FONTS,
  h1: { fontSize: 24, fontWeight: '800', color: COLORS.textDark },
  h2: { fontSize: 20, fontWeight: '700', color: COLORS.textDark },
  h3: { fontSize: 16, fontWeight: '700', color: COLORS.textDark },
  body: { fontSize: 14, color: COLORS.textGray, lineHeight: 22 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
};

// ─────────────────────────────────────────────────────────────
// Background Waves SVG
// ─────────────────────────────────────────────────────────────
const BackgroundWaves = () => (
  <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Path
        d={`M0 0 L0 ${height * 0.25} Q ${width * 0.3} ${height * 0.3} ${width * 0.4} 0 Z`}
        fill={COLORS.primaryLight}
        opacity={0.7}
      />
      <Path
        d={`M0 ${height} L0 ${height * 0.85} Q ${width * 0.5} ${height * 0.95} ${width} ${height * 0.8} L${width} ${height} Z`}
        fill={COLORS.primaryLight}
        opacity={0.5}
      />
    </Svg>
  </View>
);

export default function PatientAIAnalysisScreen({ navigation, route }) {
  const { patientId, visitId, patientName: routePatientName } = route?.params || {};
  const patientName = routePatientName || 'Patient';
  const isOnline = useNetworkStatus();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [offlineResult, setOfflineResult] = useState(null);
  
  // ── Form State ─────────────────────────────────────
  const [bodyLocations, setBodyLocations] = useState([]);
  const [images, setImages] = useState([]);
  const [recording, setRecording] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [vitals, setVitals] = useState({
    temperature: '',
    bloodPressure: '',
    heartRate: '',
    spO2: '',
    respiratoryRate: '',
    weight: '',
  });

  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');

  // ── Cleanup Audio ──────────────────────────────────
  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  // ── Image Handling ─────────────────────────────────
  const pickImage = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return Alert.alert("Permission required", "Camera access is needed.");
        result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) return Alert.alert("Permission required", "Gallery access is needed.");
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: true,
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(a => a.uri);
        setImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      Alert.alert("Error", "Could not pick image.");
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // ── Audio Handling ─────────────────────────────────
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') return Alert.alert("Permission required", "Microphone access is needed.");
      
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
    } catch (err) {
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
    } catch (err) {
      Alert.alert("Error", "Failed to stop recording");
    }
  };

  const playAudio = async () => {
    if (!audioUri) return;
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
        return;
      }
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: true });
      setSound(newSound);
      setIsPlaying(true);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) setIsPlaying(false);
      });
    } catch (error) {
      Alert.alert("Error", "Failed to play audio");
    }
  };

  const deleteAudio = () => {
    setAudioUri(null);
    setSound(null);
    setIsPlaying(false);
  };

  const handleVitalChange = (key, value) => {
    setVitals(prev => ({ ...prev, [key]: value }));
  };

  // ── Submission ─────────────────────────────────────
  const handleGenerateAI = async () => {
    if (!symptoms.trim() && bodyLocations.length === 0 && !audioUri && images.length === 0) {
      Alert.alert("Incomplete Data", "Please provide at least some symptoms, body map selections, voice recording, or images to proceed.");
      return;
    }

    setIsAnalyzing(true);

    try {
      const payload = {
        patientId,
        symptoms: symptoms.trim(),
        duration: duration.trim(),
        additionalNotes: additionalNotes.trim(),
        vitals,
        bodyLocations,
        voiceTranscript: '',
        imageDescriptions: [],
        voiceRecordingLocalUri: audioUri,
        imageAttachmentsLocalUris: images,
        status: 'pending',
      };

      if (visitId) {
        await updateVisitData(patientId, visitId, {
          symptoms: payload.symptoms,
          duration: payload.duration,
          additionalNotes: payload.additionalNotes,
          vitals: payload.vitals,
          bodyLocations: payload.bodyLocations,
          status: 'pending',
          doctorReviewStatus: 'pending',
        });
      }

      if (images && images.length > 0) {
        try {
          for (const imgUri of images) {
            let mimeType = 'image/jpeg';
            if (imgUri.endsWith('.png')) mimeType = 'image/png';
            await uploadFile(visitId, patientId, imgUri, 'image', mimeType);
          }
        } catch (imgErr) {
          console.error('[PatientAIAnalysis] Image upload failed:', imgErr);
        }
      }

      let finalTranscript = '';
      if (audioUri) {
        try {
          const { fileId, storagePath } = await uploadFile(visitId, patientId, audioUri, 'audio', 'audio/mp4');
          const transcriptionResult = await transcribeAudio(visitId, fileId, storagePath);
          const transcriptData = transcriptionResult?.transcript || transcriptionResult;
          finalTranscript = transcriptData?.text || '';
          
          if (finalTranscript) setLiveTranscript(finalTranscript);
          if (transcriptData?.extractedSymptoms?.length > 0) {
            payload.symptoms = (payload.symptoms ? payload.symptoms + '\n' : '') + transcriptData.extractedSymptoms.join(', ');
          }
        } catch (transcriptionErr) {
          console.error('[PatientAIAnalysis] Transcription failed:', transcriptionErr);
        }
      }
      
      if (!isOnline) {
        // Run completely offline assessment
        const result = computeOfflineAssessment({
          vitals,
          symptoms: payload.symptoms,
          additionalNotes: payload.additionalNotes,
          bodyLocations: payload.bodyLocations
        }, null); // no history passed for simplicity
        
        await saveOfflineAssessment(visitId, result);
        setIsAnalyzing(false);
        setOfflineResult(result);
        return; // Stop here, do not navigate to AI screen
      }

      payload.voiceTranscript = finalTranscript;
      const result = await analyzeVisit(visitId, payload);
      
      setIsAnalyzing(false);
      
      // Navigation to the dedicated AI results screen
      navigation.navigate('AIAnalysisResult', { aiResult: result.assessment, patientName, visitId, patientId });

    } catch (error) {
      setIsAnalyzing(false);
      const msg = error?.message || 'Failed to analyze. Please try again.';
      Alert.alert('Analysis Failed', msg);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <BackgroundWaves />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* ── Page Header ───────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <View style={[styles.networkBadge, { backgroundColor: isOnline ? '#16A34A' : '#D97706' }]}>
            <Text style={styles.networkBadgeText}>{isOnline ? 'ONLINE' : 'OFFLINE MODE'}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ── Title Area ──────────────────────── */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.pageTitle}>Clinical Intake</Text>
              <Text style={styles.pageSubtitle}>Gather details for AI assessment.</Text>
            </View>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={12} color={COLORS.primary} />
              <Text style={styles.aiBadgeText}> AI Ready</Text>
            </View>
          </View>

          {/* ── Patient Profile Card ────────────── */}
          <View style={styles.patientCard}>
            <View style={styles.patientAvatar}>
              <Text style={styles.patientInitials}>{patientName.charAt(0)}</Text>
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{patientName}</Text>
              <Text style={styles.patientMeta}>ID: {patientId?.substring(0,8) || 'N/A'}</Text>
            </View>
          </View>

          {/* ── Section 1: Body Map ─────────────── */}
          <Text style={styles.sectionTitle}>1. Affected Body Areas</Text>
          <Text style={styles.sectionSubtitle}>Tap to select affected areas</Text>
          <BodyMap onSelectionsChange={setBodyLocations} />

          {/* ── Section 2: Symptoms & Notes ─────── */}
          <Text style={styles.sectionTitle}>2. Symptoms & Description</Text>
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Primary Symptoms</Text>
            <TextInput
              style={styles.textArea}
              placeholder="e.g. Severe headache, fever"
              multiline
              numberOfLines={3}
              value={symptoms}
              onChangeText={setSymptoms}
              placeholderTextColor={COLORS.textGray}
            />
            
            <Text style={styles.inputLabel}>Duration</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 3 days"
              value={duration}
              onChangeText={setDuration}
              placeholderTextColor={COLORS.textGray}
            />

            <Text style={styles.inputLabel}>Additional Notes</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Any other observations..."
              multiline
              numberOfLines={2}
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
              placeholderTextColor={COLORS.textGray}
            />
          </View>

          {/* ── Section 3: Image Upload ─────────── */}
          <Text style={styles.sectionTitle}>3. Upload Images</Text>
          <View style={styles.card}>
            <View style={styles.imgActionRow}>
              <TouchableOpacity style={styles.chooseImgBtn} onPress={() => pickImage(true)}>
                <Ionicons name="camera-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.chooseImgText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chooseImgBtn} onPress={() => pickImage(false)}>
                <Ionicons name="images-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.chooseImgText}>Gallery</Text>
              </TouchableOpacity>
            </View>

            {images.length > 0 && (
              <View style={styles.imgGrid}>
                {images.map((uri, idx) => (
                  <View key={idx} style={styles.imgWrapper}>
                    <Image source={{ uri }} style={styles.thumbnail} />
                    <TouchableOpacity style={styles.removeImgBtn} onPress={() => removeImage(idx)}>
                      <Ionicons name="close" size={12} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── Section 4: Voice Description ────── */}
          <Text style={styles.sectionTitle}>4. Voice Recording</Text>
          <View style={styles.voiceCard}>
            {!audioUri ? (
              <TouchableOpacity 
                style={[styles.micBtn, recording && styles.micBtnRecording]} 
                onPress={recording ? stopRecording : startRecording}
              >
                <Ionicons name={recording ? "stop" : "mic"} size={24} color={recording ? COLORS.white : COLORS.primary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.micBtn} onPress={playAudio}>
                <Ionicons name={isPlaying ? "pause" : "play"} size={24} color={COLORS.primary} />
              </TouchableOpacity>
            )}

            <View style={styles.voiceTextContainer}>
              {!audioUri ? (
                <>
                  <Text style={styles.voiceTitle}>{recording ? "Recording..." : "Tap to record symptoms"}</Text>
                  <Text style={styles.voiceSub}>{recording ? "Tap square to stop" : "Speak in any language"}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.voiceTitle}>Recording Saved</Text>
                  <Text style={styles.voiceSub}>{isPlaying ? "Playing..." : "Tap play to listen"}</Text>
                </>
              )}
            </View>

            {audioUri && (
              <TouchableOpacity onPress={deleteAudio} style={styles.deleteAudioBtn}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>

          {/* ── Section 5: Vitals ───────────────── */}
          <Text style={styles.sectionTitle}>5. Vitals (Optional)</Text>
          <View style={styles.vitalsGrid}>
            <VitalInput icon="thermometer" title="Temp" unit="°C" value={vitals.temperature} onChange={(v) => handleVitalChange('temperature', v)} color="#F59E0B" />
            <VitalInput icon="cards-heart" title="BP" unit="mmHg" value={vitals.bloodPressure} onChange={(v) => handleVitalChange('bloodPressure', v)} color="#EF4444" />
            <VitalInput icon="heart-pulse" title="HR" unit="bpm" value={vitals.heartRate} onChange={(v) => handleVitalChange('heartRate', v)} color="#EF4444" />
            <VitalInput icon="water-percent" title="SpO2" unit="%" value={vitals.spO2} onChange={(v) => handleVitalChange('spO2', v)} color={COLORS.primary} />
            <VitalInput icon="lungs" title="Resp" unit="/min" value={vitals.respiratoryRate} onChange={(v) => handleVitalChange('respiratoryRate', v)} color="#8B5CF6" />
            <VitalInput icon="scale-bathroom" title="Weight" unit="kg" value={vitals.weight} onChange={(v) => handleVitalChange('weight', v)} color="#F59E0B" />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* ── Fixed Bottom Button ─────────────── */}
        <View style={styles.bottomBtnWrapper}>
            <TouchableOpacity
              style={[styles.submitBtn, (!symptoms && bodyLocations.length === 0 && !audioUri && images.length === 0) && styles.submitBtnDisabled]}
              onPress={handleGenerateAI}
              disabled={isAnalyzing}
              activeOpacity={0.8}
            >
              {isAnalyzing ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <>
                  <Ionicons name={isOnline ? "sparkles" : "medkit"} size={20} color={COLORS.white} />
                  <Text style={styles.submitBtnText}>{isOnline ? 'Generate AI Analysis' : 'Run Offline Assessment'}</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Offline Result Display Block */}
            {offlineResult && (
              <View style={styles.offlineResultContainer}>
                <View style={styles.offlineHeader}>
                  <MaterialCommunityIcons name="shield-check" size={24} color="#0E7490" />
                  <Text style={styles.offlineTitle}>OFFLINE ASSESSMENT</Text>
                </View>

                <View style={styles.offlineCard}>
                  <View style={styles.offlineRow}>
                    <Text style={styles.offlineLabel}>NEWS2 Score:</Text>
                    <Text style={styles.offlineValue}>{offlineResult.news2?.score ?? 'N/A'} - {offlineResult.news2?.riskCategory}</Text>
                  </View>
                  <View style={styles.offlineRow}>
                    <Text style={styles.offlineLabel}>GCS Score:</Text>
                    <Text style={styles.offlineValue}>{offlineResult.gcs?.total ? `${offlineResult.gcs.total}/15` : 'Not recorded'}</Text>
                  </View>
                  <View style={styles.offlineRow}>
                    <Text style={styles.offlineLabel}>Red Flags:</Text>
                    <Text style={styles.offlineValue}>{offlineResult.redFlags?.length > 0 ? offlineResult.redFlags.join(', ') : 'None detected'}</Text>
                  </View>
                  <View style={styles.offlineRow}>
                    <Text style={styles.offlineLabel}>Patient Trend:</Text>
                    <Text style={styles.offlineValue}>{offlineResult.trend?.overallTrend}</Text>
                  </View>
                  <View style={styles.offlineRow}>
                    <Text style={styles.offlineLabel}>Missing Info:</Text>
                    <Text style={styles.offlineValue}>{offlineResult.missingInformation?.length > 0 ? offlineResult.missingInformation.join(', ') : 'None'}</Text>
                  </View>
                  <View style={[styles.offlineRow, { borderBottomWidth: 0, marginTop: 8 }]}>
                    <Text style={styles.offlineLabel}>Recommendation:</Text>
                    <Text style={[styles.offlineValue, { color: offlineResult.doctorReviewRequired ? '#DC2626' : '#16A34A', fontWeight: 'bold' }]}>
                      {offlineResult.overallStatus}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.offlineDisclaimer}>
                  <Ionicons name="information-circle" size={16} color="#64748B" />
                  <Text style={styles.offlineDisclaimerText}>
                    Offline clinical support is based on configured rules and clinical scoring tools. Full AI assessment will be available after synchronization.
                  </Text>
                </View>
              </View>
            )}
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────
const VitalInput = ({ icon, title, unit, value, onChange, color }) => (
  <View style={styles.vitalCard}>
    <View style={styles.vitalHeader}>
      <MaterialCommunityIcons name={icon} size={16} color={color} />
      <Text style={styles.vitalTitle}>{title}</Text>
    </View>
    <View style={styles.vitalInputRow}>
      <TextInput
        style={styles.vitalInput}
        placeholder="-"
        placeholderTextColor={COLORS.textGray}
        keyboardType="numeric"
        value={value}
        onChangeText={onChange}
      />
      <Text style={styles.vitalUnit}>{unit}</Text>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { padding: 4 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 },
  pageTitle: { ...FONTS.h1, marginBottom: 8 },
  pageSubtitle: { ...FONTS.body },
  aiBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  aiBadgeText: { ...FONTS.label, color: COLORS.primary, fontSize: 12 },
  patientCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  patientAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  patientInitials: { ...FONTS.h3, color: COLORS.primary },
  patientInfo: { flex: 1 },
  patientName: { ...FONTS.h3, fontSize: 15, marginBottom: 4 },
  patientMeta: { ...FONTS.body, fontSize: 12 },
  sectionTitle: { ...FONTS.label, fontSize: 14, marginBottom: 8, marginTop: 16 },
  sectionSubtitle: { ...FONTS.body, fontSize: 13, marginBottom: 16, marginTop: -4 },
  card: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  inputLabel: { ...FONTS.label, fontSize: 12, color: COLORS.textGray, marginBottom: 8, marginTop: 8 },
  input: { backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 10, ...FONTS.body, color: COLORS.textDark },
  textArea: { backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 10, ...FONTS.body, color: COLORS.textDark, textAlignVertical: 'top' },
  imgActionRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  chooseImgBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  chooseImgText: { ...FONTS.label, color: COLORS.primary, fontSize: 13 },
  imgGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  imgWrapper: { position: 'relative', width: 70, height: 70, borderRadius: 12, overflow: 'hidden' },
  thumbnail: { width: '100%', height: '100%' },
  removeImgBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  voiceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  micBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  micBtnRecording: { backgroundColor: '#EF4444' },
  voiceTextContainer: { flex: 1 },
  voiceTitle: { ...FONTS.label, fontSize: 14, marginBottom: 4 },
  voiceSub: { ...FONTS.body, fontSize: 12 },
  deleteAudioBtn: { padding: 8 },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  vitalCard: { width: '48%', backgroundColor: COLORS.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  vitalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  vitalTitle: { ...FONTS.label, fontSize: 13, color: COLORS.textDark, marginLeft: 8 },
  vitalInputRow: { flexDirection: 'row', alignItems: 'baseline' },
  vitalInput: { ...FONTS.h3, color: COLORS.primary, padding: 0, minWidth: 40, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  vitalUnit: { ...FONTS.body, fontSize: 12, color: COLORS.textGray, marginLeft: 4 },
  bottomBtnWrapper: { backgroundColor: COLORS.bg, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 16 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 18, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700', marginLeft: 10 },
  networkBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 4 },
  networkBadgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  offlineResultContainer: { marginTop: 20, backgroundColor: '#F0F9FF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#BAE6FD' },
  offlineHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  offlineTitle: { ...FONTS.h2, color: '#0E7490', marginLeft: 8 },
  offlineCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 12 },
  offlineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  offlineLabel: { ...FONTS.label, color: '#0369A1' },
  offlineValue: { ...FONTS.body, color: '#0F172A', fontWeight: '500', maxWidth: '65%', textAlign: 'right' },
  offlineDisclaimer: { flexDirection: 'row', marginTop: 16, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 8 },
  offlineDisclaimerText: { ...FONTS.body, fontSize: 12, color: '#475569', marginLeft: 8, flex: 1 },
});
