import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from '../../theme';

const COMPLAINT_OPTIONS = ['Pain', 'Swelling', 'Rash', 'Wound', 'Numbness', 'Other'];
const SEVERITY_OPTIONS = ['Mild', 'Moderate', 'Severe'];

export default function BodyMap({ onSelectionsChange }) {
  const [view, setView] = useState('front'); // 'front' | 'back'
  const [selections, setSelections] = useState([]);
  
  // Interaction State
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0 });
  const [pendingSelection, setPendingSelection] = useState(null);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(COMPLAINT_OPTIONS[0]);
  const [selectedSeverity, setSelectedSeverity] = useState(SEVERITY_OPTIONS[1]);

  const handleMapPress = (e) => {
    if (!imageLayout.width || !imageLayout.height) return;
    
    const { locationX, locationY } = e.nativeEvent;
    const xPct = (locationX / imageLayout.width) * 100;
    const yPct = (locationY / imageLayout.height) * 100;
    
    setPendingSelection({ xPct, yPct });
    setCustomLabel('');
    setSelectedComplaint(COMPLAINT_OPTIONS[0]);
    setSelectedSeverity(SEVERITY_OPTIONS[1]);
    setModalVisible(true);
  };

  const handleSaveSelection = () => {
    if (pendingSelection) {
      const finalLabel = customLabel.trim() || 'Selected Area';
      const newSelection = {
        id: Date.now().toString(), // Unique ID for markers
        region: {
          id: `custom_${Date.now()}`,
          label: finalLabel,
          side: 'center', // Dummy side for backend compatibility
        },
        side: 'center',
        view: view,
        complaint: selectedComplaint,
        severity: selectedSeverity,
        xPct: pendingSelection.xPct,
        yPct: pendingSelection.yPct,
      };
      
      const updated = [...selections, newSelection];
      setSelections(updated);
      onSelectionsChange && onSelectionsChange(updated);
    }
    setModalVisible(false);
    setPendingSelection(null);
  };

  const handleRemoveSelection = (idToRemove) => {
    const updated = selections.filter(s => s.id !== idToRemove);
    setSelections(updated);
    onSelectionsChange && onSelectionsChange(updated);
  };

  const currentImage = view === 'front' 
    ? require('../../../assets/front_image.jpeg') 
    : require('../../../assets/back_image.jpeg');

  return (
    <View style={styles.container}>
      
      {/* ── View Toggle ── */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'front' && styles.toggleBtnActive]}
          onPress={() => setView('front')}
        >
          <Text style={[styles.toggleText, view === 'front' && styles.toggleTextActive]}>Front</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'back' && styles.toggleBtnActive]}
          onPress={() => setView('back')}
        >
          <Text style={[styles.toggleText, view === 'back' && styles.toggleTextActive]}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* ── Interactive Image Map ── */}
      <View style={styles.mapWrapper}>
        <Pressable 
          style={styles.pressableArea}
          onPress={handleMapPress}
          onLayout={(e) => setImageLayout(e.nativeEvent.layout)}
        >
          <Image 
            source={currentImage} 
            style={styles.bodyImage} 
            resizeMode="contain"
          />
          
          {/* Render Markers for current view */}
          {selections.filter(s => s.view === view).map(s => (
            <View 
              key={s.id} 
              style={[
                styles.marker, 
                { left: `${s.xPct}%`, top: `${s.yPct}%` }
              ]}
            >
              <View style={styles.markerInner} />
            </View>
          ))}
        </Pressable>
        <Text style={styles.helperText}>Tap on the image to select an affected area.</Text>
      </View>

      {/* ── Selected List Summary ── */}
      {selections.length > 0 && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Selected Areas ({selections.length})</Text>
          {selections.map((item) => (
            <View key={item.id} style={styles.summaryRow}>
              <View style={styles.summaryBadge}>
                <Text style={styles.summaryBadgeText}>{item.severity}</Text>
              </View>
              <Text style={styles.summaryLabel}>
                {item.region.label} <Text style={{color: COLORS.subtle, fontSize: 12}}>({item.view})</Text>
              </Text>
              <Text style={styles.summaryComplaint}>{item.complaint}</Text>
              <TouchableOpacity onPress={() => handleRemoveSelection(item.id)} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={20} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* ── Symptom Modal ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Symptom</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={COLORS.ink} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.sectionTitle}>What body part is this?</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Lower Back, Left Knee"
                  placeholderTextColor={COLORS.subtle}
                  value={customLabel}
                  onChangeText={setCustomLabel}
                  autoFocus
                />

                <Text style={styles.sectionTitle}>What is the primary complaint?</Text>
                <View style={styles.chipRow}>
                  {COMPLAINT_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.chip, selectedComplaint === opt && styles.chipActive]}
                      onPress={() => setSelectedComplaint(opt)}
                    >
                      <Text style={[styles.chipText, selectedComplaint === opt && styles.chipTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionTitle}>Severity level?</Text>
                <View style={styles.chipRow}>
                  {SEVERITY_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.chip, selectedSeverity === opt && styles.chipActive]}
                      onPress={() => setSelectedSeverity(opt)}
                    >
                      <Text style={[styles.chipText, selectedSeverity === opt && styles.chipTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSelection}>
                <Text style={styles.saveBtnText}>Save Area</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
    padding: SPACING.md,
    ...SHADOW.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SPACING.md,
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.white,
    ...SHADOW.sm,
  },
  toggleText: {
    ...FONTS.label,
    color: COLORS.subtle,
  },
  toggleTextActive: {
    color: COLORS.brand,
  },
  mapWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
  },
  pressableArea: {
    width: '100%',
    height: 380,
    position: 'relative',
  },
  bodyImage: {
    width: '100%',
    height: '100%',
  },
  marker: {
    position: 'absolute',
    width: 24,
    height: 24,
    marginLeft: -12, // center the marker
    marginTop: -12,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.25)', // light red ring
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.danger, // solid red dot
    borderWidth: 2,
    borderColor: COLORS.white,
    ...SHADOW.sm,
  },
  helperText: {
    ...FONTS.bodyS,
    color: COLORS.subtle,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
  summaryContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
  },
  summaryTitle: {
    ...FONTS.h4,
    fontSize: 14,
    marginBottom: SPACING.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    padding: 8,
    borderRadius: RADIUS.sm,
    marginBottom: 6,
  },
  summaryBadge: {
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginRight: 8,
  },
  summaryBadgeText: {
    ...FONTS.badge,
    color: COLORS.warning,
    fontSize: 10,
  },
  summaryLabel: {
    ...FONTS.label,
    flex: 1,
  },
  summaryComplaint: {
    ...FONTS.bodyS,
    color: COLORS.subtle,
    marginRight: 10,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  modalTitle: {
    ...FONTS.h3,
  },
  sectionTitle: {
    ...FONTS.label,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  textInput: {
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 15,
    color: COLORS.ink,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: COLORS.brand + '15',
    borderColor: COLORS.brand,
  },
  chipText: {
    ...FONTS.label,
    color: COLORS.subtle,
  },
  chipTextActive: {
    color: COLORS.brand,
  },
  saveBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg, // for safe area
  },
  saveBtnText: {
    ...FONTS.btn,
  }
});
