import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useUserStore } from '@/store/userStore';

const EditProfileScreen = () => {
  const { name, location, avatarUri, setName, setLocation, setAvatarUri } =
    useUserStore();

  // Split lokasi menjadi kota & negara (format: "Kota, Negara")
  const [city, setCity] = useState(location.split(',')[0]?.trim() ?? '');
  const [country, setCountry] = useState(location.split(',')[1]?.trim() ?? '');
  const [localName, setLocalName] = useState(name);
  const [localAvatar, setLocalAvatar] = useState<string | null>(avatarUri);
  const [loading, setLoading] = useState(false);

  // ── Pilih foto ──────────────────────────────────────────────────────────────
  const pickImage = async () => {
    Alert.alert('Ganti Foto Profil', 'Pilih sumber foto', [
      {
        text: 'Kamera',
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) {
            Alert.alert('Izin diperlukan', 'Aktifkan izin kamera di pengaturan.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled) setLocalAvatar(result.assets[0].uri);
        },
      },
      {
        text: 'Galeri',
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) {
            Alert.alert('Izin diperlukan', 'Aktifkan izin galeri di pengaturan.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled) setLocalAvatar(result.assets[0].uri);
        },
      },
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  // ── Simpan ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!localName.trim()) {
      Alert.alert('Nama tidak boleh kosong');
      return;
    }

    setLoading(true);

    // Gabungkan kota & negara
    const newLocation = [city.trim(), country.trim()]
      .filter(Boolean)
      .join(', ');

    setName(localName.trim());
    setLocation(newLocation || location);
    if (localAvatar) setAvatarUri(localAvatar);

    setTimeout(() => {
      setLoading(false);
      router.back();
    }, 400);
  };

  const hasChanges =
    localName !== name ||
    city !== (location.split(',')[0]?.trim() ?? '') ||
    country !== (location.split(',')[1]?.trim() ?? '') ||
    localAvatar !== avatarUri;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profil</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={pickImage}
            activeOpacity={0.85}
          >
            <Image
              source={{ uri: localAvatar ?? 'https://i.pravatar.cc/100' }}
              style={styles.avatar}
            />
            <View style={styles.cameraOverlay}>
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.cameraText}>Ganti Foto</Text>
            </View>
          </TouchableOpacity>

          {/* Form */}
          <View style={styles.form}>
            {/* Nama */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nama Lengkap</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={localName}
                  onChangeText={setLocalName}
                  placeholder="Masukkan nama lengkap"
                  placeholderTextColor="#bbb"
                  maxLength={40}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Kota */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Kota</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="business-outline" size={18} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Contoh: Surakarta"
                  placeholderTextColor="#bbb"
                  maxLength={50}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Negara */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Negara</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="globe-outline" size={18} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={country}
                  onChangeText={setCountry}
                  placeholder="Contoh: Indonesia"
                  placeholderTextColor="#bbb"
                  maxLength={50}
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                />
              </View>
            </View>

            {/* Preview lokasi */}
            {(city || country) && (
              <View style={styles.previewRow}>
                <Ionicons name="location-sharp" size={13} color="#2E7D32" />
                <Text style={styles.previewText}>
                  {[city, country].filter(Boolean).join(', ')}
                </Text>
              </View>
            )}
          </View>

          {/* Tombol Simpan */}
          <TouchableOpacity
            style={[styles.saveBtn, !hasChanges && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!hasChanges || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 28,
  },
  avatarWrapper: {
    alignSelf: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#E8F5E9',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: 'rgba(0,0,0,0.52)',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  cameraText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  form: {
    gap: 18,
    marginBottom: 28,
  },
  fieldGroup: {
    gap: 7,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -6,
    marginLeft: 2,
  },
  previewText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  saveBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#A5D6A7',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});