import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_FAMILY, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../constants/theme';

interface PhotoPickerProps {
  photoUri?: string;
  onPhotoSelected: (uri: string, base64?: string) => void;
  onPhotoRemoved: () => void;
}

export const PhotoPicker: React.FC<PhotoPickerProps> = ({
  photoUri,
  onPhotoSelected,
  onPhotoRemoved,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTakePhoto = async () => {
    setModalVisible(false);
    try {
      setLoading(true);
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Camera access is required to take student screening photos. Please allow camera permissions in settings.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        onPhotoSelected(asset.uri, asset.base64 ?? undefined);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Camera Error', 'Could not open camera on this device.');
    } finally {
      setLoading(false);
    }
  };

  const handleChoosePhoto = async () => {
    setModalVisible(false);
    try {
      setLoading(true);
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Photo library access is required to select student screening photos. Please allow photos access in settings.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        onPhotoSelected(asset.uri, asset.base64 ?? undefined);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Gallery Error', 'Could not open photo library on this device.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {photoUri ? (
        <View style={[styles.previewCard, SHADOWS.sm]}>
          <View style={styles.imageFrame}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.changeButton, { backgroundColor: COLORS.primaryPale }]}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-reverse-outline" size={16} color={COLORS.primary} />
              <Text style={styles.changeButtonText}>Change Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.removeButton, { backgroundColor: COLORS.dangerPale }]}
              onPress={onPhotoRemoved}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadArea}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="camera-outline" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.uploadTitle}>Add Student Photo</Text>
          <Text style={styles.uploadSubtitle}>
            Tap to take with camera or choose from gallery
          </Text>
        </TouchableOpacity>
      )}

      {/* Action Menu Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Student Photograph</Text>
              <Text style={styles.modalSubtitle}>Select an option to add a student photo</Text>
            </View>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleTakePhoto}
              activeOpacity={0.7}
              disabled={loading}
            >
              <View style={[styles.optionIconBox, { backgroundColor: COLORS.primaryPale }]}>
                <Ionicons name="camera" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.optionTextBox}>
                <Text style={styles.optionTitle}>Take Photo</Text>
                <Text style={styles.optionDesc}>Capture photo using device camera</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleChoosePhoto}
              activeOpacity={0.7}
              disabled={loading}
            >
              <View style={[styles.optionIconBox, { backgroundColor: COLORS.secondaryLight }]}>
                <Ionicons name="images" size={22} color={COLORS.secondary} />
              </View>
              <View style={styles.optionTextBox}>
                <Text style={styles.optionTitle}>Choose Photo</Text>
                <Text style={styles.optionDesc}>Select existing photo from gallery</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.primaryPale,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  uploadTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primaryDark,
    fontFamily: FONT_FAMILY.body,
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontFamily: FONT_FAMILY.body,
  },
  previewCard: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageFrame: {
    width: 140,
    height: 140,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 12,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BORDER_RADIUS.sm,
    gap: 6,
  },
  changeButtonText: {
    color: COLORS.primaryDark,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILY.body,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BORDER_RADIUS.sm,
    gap: 6,
  },
  removeButtonText: {
    color: COLORS.danger,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILY.body,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.body,
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
    fontFamily: FONT_FAMILY.body,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    marginBottom: 10,
  },
  optionIconBox: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionTextBox: {
    flex: 1,
  },
  optionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.body,
  },
  optionDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 1,
    fontFamily: FONT_FAMILY.body,
  },
  cancelButton: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.body,
  },
});
