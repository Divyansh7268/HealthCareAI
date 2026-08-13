import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import Svg from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { FRONT_REGIONS, BACK_REGIONS } from './bodyRegions';
import { COLORS, FONTS, RADIUS, SHADOW, SPACING } from '../../theme';

const COMPLAINT_OPTIONS = ['Pain', 'Swelling', 'Rash', 'Wound', 'Numbness', 'Other'];
const SEVERITY_OPTIONS = ['Mild', 'Moderate', 'Severe'];

export default function BodyMap({ onSelectionsChange }) {
  const [view, setView] = useState('front'); // 'front' | 'back'
  const [selections, setSelections] = useState([]);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [activeRegion, setActiveRegion] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(COMPLAINT_OPTIONS[0]);
  const [selectedSeverity, setSelectedSeverity] = useState(SEVERITY_OPTIONS[1]);

  const handleRegionPress = (regionData) => {
    // Check if already selected
    const existingIndex = selections.findIndex(s => s.region.id === regionData.id);
    if (existingIndex >= 0) {
      // Remove if already selected
      const newSelections = [...selections];
      newSelections.splice(existingIndex, 1);
      setSelections(newSelections);
      onSelectionsChange && onSelectionsChange(newSelections);
    } else {
      // Open modal to add new selection
      setActiveRegion(regionData);
      setSelectedComplaint(COMPLAINT_OPTIONS[0]);
      setSelectedSeverity(SEVERITY_OPTIONS[1]);
      setModalVisible(true);
    }
  };

  const handleSaveSelection = () => {
    if (activeRegion) {
      const newSelection = {
        region: activeRegion,
        side: activeRegion.side,
        view: view,
        complaint: selectedComplaint,
        severity: selectedSeverity,
      };
      const updated = [...selections, newSelection];
      setSelections(updated);
      onSelectionsChange && onSelectionsChange(updated);
    }
    setModalVisible(false);
    setActiveRegion(null);
  };

  const currentRegions = view === 'front' ? FRONT_REGIONS : BACK_REGIONS;

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

      {/* ── Body SVG Map ── */}
      <View style={styles.mapContainer}>
        <Svg width="100%" height={350} viewBox="0 0 200 400">
          {currentRegions.map((region) => {
            const isSelected = selections.some(s => s.region.id === region.id);
            return (
              <React.Fragment key={region.id}>
                {region.element({
                  onPress: () => handleRegionPress(region),
                  fill: isSelected ? COLORS.brand + '80' : '#E2E8F0', // 80 is alpha hex
                  stroke: isSelected ? COLORS.brand : '#94A3B8',
                  strokeWidth: isSelected ? 2.5 : 1.5,
                })}
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* ── Selected List Summary ── */}
      {selections.length > 0 && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Selected Areas ({selections.length})</Text>
          {selections.map((item, idx) => (
            <View key={idx} style={styles.summaryRow}>
              <View style={styles.summaryBadge}>
                <Text style={styles.summaryBadgeText}>{item.severity}</Text>
              </View>
              <Text style={styles.summaryLabel}>{item.region.label}</Text>
              <Text style={styles.summaryComplaint}>{item.complaint}</Text>
              <TouchableOpacity onPress={() => handleRegionPress(item.region)} style={{ padding: 4 }}>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Symptom</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.ink} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Region: <Text style={{ fontWeight: 'bold' }}>{activeRegion?.label}</Text>
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
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
  mapContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
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
    maxHeight: '80%',
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
  modalSubtitle: {
    ...FONTS.body,
    color: COLORS.subtle,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...FONTS.label,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
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
