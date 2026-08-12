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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from '../theme';
import BodyMap from '../components/BodyMap/BodyMap';
import { updateVisitData } from '../services/patientService';
import { analyzeVisit } from '../api/visitApi';

export default function PatientAIAnalysisScreen({ navigation, route }) {
  const { patientId, visitId, patientName: routePatientName } = route?.params || {};
  const patientName = routePatientName || 'Patient';

  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  
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

  // ── Cleanup Audio ──────────────────────────────────
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
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
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

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

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
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
    setAnalysisError(null);

    try {
      // Build the structured assessment payload
      const payload = {
        patientId,
        symptoms: symptoms.trim(),
        duration: duration.trim(),
        additionalNotes: additionalNotes.trim(),
        vitals,
        bodyLocations,
        voiceTranscript: '', // Will be populated when transcription is added
        imageDescriptions: [],
        voiceRecordingLocalUri: audioUri,
        imageAttachmentsLocalUris: images,
        status: 'pending',
      };

      // Step 1: Save draft visit data to Firestore
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

      // Step 2: Call backend AI pipeline
      const result = await analyzeVisit(visitId, payload);

      setAiResult(result.assessment);
      setIsAnalyzing(false);
      setIsAnalyzed(true);

    } catch (error) {
      setIsAnalyzing(false);
      const msg = error?.message || 'Failed to analyze. Please try again.';
      setAnalysisError(msg);
      Alert.alert('Analysis Failed', msg);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* ── Page Header ───────────────────────── */}
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={COLORS.navy} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Title Area ──────────────────────── */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>AI-Assisted Assessment</Text>
            <Text style={styles.pageSubtitle}>Enter patient details for AI analysis.</Text>
          </View>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={12} color={COLORS.success} />
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
        <Text style={styles.sectionSubtitle}>Tap to select affected areas and add symptoms</Text>
        <BodyMap onSelectionsChange={setBodyLocations} />

        {/* ── Section 2: Symptoms & Notes ─────── */}
        <Text style={styles.sectionTitle}>2. Symptoms & Description</Text>
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Primary Symptoms</Text>
          <TextInput
            style={styles.textArea}
            placeholder="e.g. Severe headache, fever, and nausea"
            multiline
            numberOfLines={3}
            value={symptoms}
            onChangeText={setSymptoms}
            editable={!isAnalyzed}
          />
          
          <Text style={styles.inputLabel}>Duration</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 3 days"
            value={duration}
            onChangeText={setDuration}
            editable={!isAnalyzed}
          />

          <Text style={styles.inputLabel}>Additional Notes</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Any other observations..."
            multiline
            numberOfLines={2}
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
            editable={!isAnalyzed}
          />
        </View>

        {/* ── Section 3: Image Upload ─────────── */}
        <Text style={styles.sectionTitle}>3. Upload Images</Text>
        <View style={styles.card}>
          {!isAnalyzed && (
            <View style={styles.imgActionRow}>
              <TouchableOpacity style={styles.chooseImgBtn} onPress={() => pickImage(true)}>
                <Ionicons name="camera-outline" size={16} color={COLORS.brand} style={{ marginRight: 6 }} />
                <Text style={styles.chooseImgText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chooseImgBtn} onPress={() => pickImage(false)}>
                <Ionicons name="images-outline" size={16} color={COLORS.brand} style={{ marginRight: 6 }} />
                <Text style={styles.chooseImgText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          {images.length > 0 && (
            <View style={styles.imgGrid}>
              {images.map((uri, idx) => (
                <View key={idx} style={styles.imgWrapper}>
                  <Image source={{ uri }} style={styles.thumbnail} />
                  {!isAnalyzed && (
                    <TouchableOpacity style={styles.removeImgBtn} onPress={() => removeImage(idx)}>
                      <Ionicons name="close" size={12} color={COLORS.white} />
                    </TouchableOpacity>
                  )}
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
              disabled={isAnalyzed}
            >
              <Ionicons name={recording ? "stop" : "mic"} size={24} color={recording ? COLORS.white : COLORS.brand} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.micBtn} onPress={playAudio}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={24} color={COLORS.brand} />
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

          {audioUri && !isAnalyzed && (
            <TouchableOpacity onPress={deleteAudio} style={styles.deleteAudioBtn}>
              <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Section 5: Vitals ───────────────── */}
        <Text style={styles.sectionTitle}>5. Vitals (Optional)</Text>
        <View style={styles.vitalsGrid}>
          <VitalInput icon="thermometer" title="Temp" unit="°C" value={vitals.temperature} onChange={(v) => handleVitalChange('temperature', v)} editable={!isAnalyzed} color={COLORS.orange} />
          <VitalInput icon="cards-heart" title="BP" unit="mmHg" value={vitals.bloodPressure} onChange={(v) => handleVitalChange('bloodPressure', v)} editable={!isAnalyzed} color={COLORS.danger} />
          <VitalInput icon="heart-pulse" title="HR" unit="bpm" value={vitals.heartRate} onChange={(v) => handleVitalChange('heartRate', v)} editable={!isAnalyzed} color={COLORS.danger} />
          <VitalInput icon="water-percent" title="SpO2" unit="%" value={vitals.spO2} onChange={(v) => handleVitalChange('spO2', v)} editable={!isAnalyzed} color={COLORS.brand} />
          <VitalInput icon="lungs" title="Resp" unit="/min" value={vitals.respiratoryRate} onChange={(v) => handleVitalChange('respiratoryRate', v)} editable={!isAnalyzed} color="#9333EA" />
          <VitalInput icon="scale-bathroom" title="Weight" unit="kg" value={vitals.weight} onChange={(v) => handleVitalChange('weight', v)} editable={!isAnalyzed} color={COLORS.warning} />
        </View>

        {/* ── Generate Analysis Button / Loader ── */}
        {!isAnalyzed && !isAnalyzing && (
          <TouchableOpacity style={styles.generateBtn} onPress={handleGenerateAI} activeOpacity={0.85}>
            <Ionicons name="sparkles" size={18} color={COLORS.white} />
            <Text style={styles.generateBtnText}>Save & Generate AI Analysis</Text>
          </TouchableOpacity>
        )}

        {isAnalyzing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.brand} />
            <Text style={styles.loadingText}>Saving & Analyzing...</Text>
            <Text style={styles.loadingSub}>Securely storing data</Text>
          </View>
        )}

        {/* ── AI Assessment Results ──────────── */}
        {isAnalyzed && aiResult && (
          <View>
            <Text style={styles.sectionTitle}>AI Assessment Results</Text>
            {/* Risk Level Banner */}
            <View style={[styles.riskBanner, { backgroundColor: riskColor(aiResult.riskLevel) + '20', borderColor: riskColor(aiResult.riskLevel) }]}>
              <Ionicons name="alert-circle" size={18} color={riskColor(aiResult.riskLevel)} />
              <Text style={[styles.riskText, { color: riskColor(aiResult.riskLevel) }]}>
                Risk Level: {aiResult.riskLevel?.toUpperCase()}
              </Text>
              <Text style={[styles.urgencyText, { color: riskColor(aiResult.riskLevel) }]}> · {aiResult.urgency?.toUpperCase()}</Text>
            </View>

            {/* Possible Conditions */}
            <View style={styles.aiCard}>
              <Text style={styles.aiCardTitle}>Possible Conditions</Text>
              {aiResult.possibleConditions?.map((c, i) => (
                <View key={i} style={styles.aiRow}>
                  <Ionicons name="medkit-outline" size={14} color={COLORS.brand} />
                  <Text style={styles.aiRowText}><Text style={{fontWeight:'700'}}>{c.name}</Text> ({c.likelihood})</Text>
                </View>
              ))}
            </View>

            {/* Recommended Actions */}
            <View style={styles.aiCard}>
              <Text style={styles.aiCardTitle}>Recommended Actions</Text>
              {aiResult.recommendedActions?.map((a, i) => (
                <View key={i} style={styles.aiRow}>
                  <Ionicons name="checkmark-circle-outline" size={14} color={COLORS.success} />
                  <Text style={styles.aiRowText}>{a}</Text>
                </View>
              ))}
            </View>

            {/* Referral */}
            {aiResult.referralRequired && (
              <View style={[styles.aiCard, { borderColor: COLORS.danger }]}>
                <Text style={[styles.aiCardTitle, { color: COLORS.danger }]}>⚠ Referral Required</Text>
                <Text style={styles.aiRowText}>{aiResult.referralReason}</Text>
              </View>
            )}

            {/* Disclaimer */}
            <Text style={styles.disclaimer}>{aiResult.disclaimer || 'This is AI-generated and not a clinical diagnosis.'}</Text>

            <TouchableOpacity style={styles.sendBtn} onPress={() => navigation.navigate('HealthWorkerDashboard')}>
              <Text style={styles.sendBtnText}>Send to Doctor for Review</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper: risk colour
function riskColor(level) {
  switch(level) {
    case 'critical': return '#DC2626';
    case 'high':     return '#EA580C';
    case 'moderate': return '#D97706';
    default:         return '#16A34A';
  }
}

// ─────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────
const VitalInput = ({ icon, title, unit, value, onChange, editable, color }) => (
  <View style={styles.vitalCard}>
    <View style={styles.vitalHeader}>
      <MaterialCommunityIcons name={icon} size={16} color={color} />
      <Text style={styles.vitalTitle}>{title}</Text>
    </View>
    <View style={styles.vitalInputRow}>
      <TextInput
        style={styles.vitalInput}
        placeholder="-"
        placeholderTextColor={COLORS.subtle}
        keyboardType="numeric"
        value={value}
        onChangeText={onChange}
        editable={editable}
      />
      <Text style={styles.vitalUnit}>{unit}</Text>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  pageHeader: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: SPACING.lg },
  pageTitle: { ...FONTS.h2, fontSize: 20, marginBottom: 2 },
  pageSubtitle: { ...FONTS.bodyS, color: COLORS.subtle },
  aiBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.greenLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.successBorder },
  aiBadgeText: { ...FONTS.badge, color: COLORS.success, fontSize: 12 },
  patientCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.xl, ...SHADOW.sm },
  patientAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.brandLight, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  patientInitials: { ...FONTS.h3, color: COLORS.brand },
  patientInfo: { flex: 1 },
  patientName: { ...FONTS.h4, fontSize: 16, marginBottom: 2 },
  patientMeta: { ...FONTS.bodyS, fontSize: 12 },
  sectionTitle: { ...FONTS.h4, fontSize: 15, marginBottom: SPACING.md, marginTop: SPACING.lg },
  sectionSubtitle: { ...FONTS.bodyS, color: COLORS.subtle, marginTop: -SPACING.sm, marginBottom: SPACING.md },
  card: { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOW.sm },
  inputLabel: { ...FONTS.label, fontSize: 12, color: COLORS.subtle, marginBottom: 4, marginTop: 8 },
  input: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.surface, borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 10, ...FONTS.body, color: COLORS.ink },
  textArea: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.surface, borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 10, ...FONTS.body, color: COLORS.ink, textAlignVertical: 'top' },
  imgActionRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  chooseImgBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.brandMid },
  chooseImgText: { ...FONTS.label, color: COLORS.brand },
  imgGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  imgWrapper: { position: 'relative', width: 70, height: 70, borderRadius: RADIUS.sm, overflow: 'hidden' },
  thumbnail: { width: '100%', height: '100%' },
  removeImgBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  voiceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOW.sm },
  micBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.brandLight, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  micBtnRecording: { backgroundColor: COLORS.danger },
  voiceTextContainer: { flex: 1 },
  voiceTitle: { ...FONTS.label, fontSize: 14, marginBottom: 2 },
  voiceSub: { ...FONTS.bodyS, fontSize: 12 },
  deleteAudioBtn: { padding: 8 },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl },
  vitalCard: { width: '48%', backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.sm, ...SHADOW.sm },
  vitalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  vitalTitle: { ...FONTS.label, fontSize: 13, color: COLORS.ink, marginLeft: 6 },
  vitalInputRow: { flexDirection: 'row', alignItems: 'baseline' },
  vitalInput: { ...FONTS.h3, color: COLORS.brand, padding: 0, minWidth: 40, borderBottomWidth: 1, borderBottomColor: COLORS.surface },
  vitalUnit: { ...FONTS.bodyS, color: COLORS.subtle, marginLeft: 4 },
  generateBtn: { flexDirection: 'row', backgroundColor: COLORS.brand, paddingVertical: 16, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.xl, ...SHADOW.md },
  generateBtnText: { ...FONTS.btn, marginLeft: 8 },
  loadingContainer: { alignItems: 'center', marginTop: SPACING.xl, padding: SPACING.xl, backgroundColor: COLORS.bg, borderRadius: RADIUS.lg },
  loadingText: { ...FONTS.h4, color: COLORS.brand, marginTop: SPACING.md },
  loadingSub: { ...FONTS.bodyS, color: COLORS.subtle, marginTop: 4 },
  riskBanner: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1.5, marginBottom: SPACING.sm },
  riskText: { ...FONTS.h4, fontSize: 14, marginLeft: 6 },
  urgencyText: { ...FONTS.label, fontSize: 12 },
  aiCard: { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.sm },
  aiCardTitle: { ...FONTS.h4, fontSize: 13, marginBottom: 6, color: COLORS.ink },
  aiRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  aiRowText: { ...FONTS.bodyS, color: COLORS.ink, flex: 1, lineHeight: 18 },
  disclaimer: { ...FONTS.bodyS, color: COLORS.subtle, textAlign: 'center', marginVertical: SPACING.md, paddingHorizontal: SPACING.md, fontStyle: 'italic' },
  bottomBar: { marginTop: SPACING.xl },
  sendBtn: { flexDirection: 'row', backgroundColor: COLORS.brand, paddingVertical: 16, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { ...FONTS.btn, color: COLORS.white },
});
