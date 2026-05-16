import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Modal, KeyboardAvoidingView,
  Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { listCollections, createCollection } from '../../src/api';
import { useAuth } from '../../src/AuthContext';
import { colors } from '../../src/colors';
import { Collection, CollectionsResponse } from '../../src/types';

export default function CollectionsScreen() {
  const { signOut } = useAuth();
  const [collections, setCollections] = useState<CollectionsResponse>({ owned: [], shared: [] });
  const [loading,     setLoading]     = useState(true);
  const [newColName,  setNewColName]  = useState('');
  const [creating,    setCreating]    = useState(false);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [error,       setError]       = useState('');

  useEffect(() => { fetchCollections(); }, []);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const res = await listCollections();
      setCollections(res.data as CollectionsResponse);
    } catch (err: any) {
      if (err.response?.status === 401) {
        await signOut();
        router.replace('/(auth)/login');
      }
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newColName.trim()) return;
    setCreating(true);
    setError('');
    try {
      await createCollection({ name: newColName.trim() });
      setNewColName('');
      setModalOpen(false);
      fetchCollections();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
    setCreating(false);
  };

  const openCollection = (col: Collection) =>
    router.push({ pathname: '/collection/[id]', params: { id: col.id, name: col.name } });

  const renderItem = ({ item }: { item: Collection }) => (
    <TouchableOpacity style={styles.card} onPress={() => openCollection(item)}>
      <Text style={styles.cardName}>{item.name}</Text>
      <Text style={styles.cardChevron}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[
          ...collections.owned.map(c => ({ ...c, _section: 'owned' })),
          ...collections.shared.map(c => ({ ...c, _section: 'shared' })),
        ]}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={
          collections.shared.length > 0 ? (
            <Text style={styles.sectionLabel}>YOUR COLLECTIONS</Text>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No collections yet. Create one!</Text>
        }
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalOpen(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New collection</Text>
            <TextInput
              style={styles.input}
              placeholder="Collection name"
              placeholderTextColor={colors.muted}
              value={newColName}
              onChangeText={setNewColName}
              autoFocus
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => { setModalOpen(false); setError(''); }} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate} style={styles.createBtn} disabled={creating}>
                {creating
                  ? <ActivityIndicator color={colors.bg} />
                  : <Text style={styles.createText}>Create</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.bg },
  center:        { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  list:          { padding: 16, paddingBottom: 100 },
  sectionLabel:  { color: colors.muted, fontSize: 11, letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  card:          { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: colors.border },
  cardName:      { flex: 1, color: colors.text, fontSize: 15 },
  cardChevron:   { color: colors.muted, fontSize: 20 },
  separator:     { height: 8 },
  empty:         { color: colors.muted, textAlign: 'center', marginTop: 60, fontSize: 14 },
  fab:           { position: 'absolute', bottom: 28, right: 24, backgroundColor: colors.accent, width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText:       { color: colors.bg, fontSize: 28, lineHeight: 32 },
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 28 },
  modalCard:     { backgroundColor: colors.surface, borderRadius: 12, padding: 24, borderWidth: 1, borderColor: colors.border },
  modalTitle:    { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 16 },
  input:         { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 8, color: colors.text, fontSize: 14, padding: 12, marginBottom: 12 },
  error:         { color: colors.error, fontSize: 12, marginBottom: 8 },
  modalActions:  { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn:     { padding: 10 },
  cancelText:    { color: colors.muted, fontSize: 14 },
  createBtn:     { backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 10 },
  createText:    { color: colors.bg, fontWeight: '700', fontSize: 14 },
});
