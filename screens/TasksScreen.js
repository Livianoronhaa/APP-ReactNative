import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  Image,
} from 'react-native';
import { ref, push, onValue, remove, update } from 'firebase/database';
import { database, auth } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

const logo = require('../assets/logotipo.png');

// Color palette
const colors = {
  primaryDark: '#3E2676',
  primaryLight: '#8B5CF6',
  accent: '#E9D5FF',
  white: '#FFFFFF',
  textDark: '#3E2676',
  danger: '#EF4444',
  success: '#10B981',
  placeholder: '#A78BFA',
};

export default function TasksScreen() {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [editText, setEditText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      const tasksRef = ref(database, `tasks/${auth.currentUser.uid}`);

      onValue(tasksRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const tasksList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setTasks(tasksList);
        } else {
          setTasks([]);
        }
      });
    }
  }, []);

  const handleAddTask = () => {
    if (task.trim() && auth.currentUser) {
      const tasksRef = ref(database, `tasks/${auth.currentUser.uid}`);
      push(tasksRef, {
        text: task,
        completed: false,
        createdAt: new Date().toISOString(),
      });
      setTask('');
    }
  };

  const handleDeleteTask = (id) => {
    if (auth.currentUser) {
      const taskRef = ref(database, `tasks/${auth.currentUser.uid}/${id}`);
      remove(taskRef);
    }
  };

  const toggleTaskCompletion = (id, currentStatus) => {
    if (auth.currentUser) {
      const taskRef = ref(database, `tasks/${auth.currentUser.uid}/${id}`);
      update(taskRef, { completed: !currentStatus });
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setEditText(task.text);
    setModalVisible(true);
  };

  const handleEditTask = () => {
    if (editText.trim() && auth.currentUser && editingTask) {
      const taskRef = ref(
        database,
        `tasks/${auth.currentUser.uid}/${editingTask.id}`
      );
      update(taskRef, { text: editText });
      setModalVisible(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.primaryDark }]}
    >
      <View style={styles.innerContainer}>
        <Image
          source={logo}
          style={styles.logo}
          resizeMode="contain"
          onError={(e) =>
            console.log('Error loading logo:', e.nativeEvent.error)
          }
        />

        <Text style={[styles.title, { color: colors.white }]}>
          Minhas Tarefas
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.white,
                borderColor: colors.primaryLight,
                color: colors.textDark,
              },
            ]}
            placeholder="Nova tarefa..."
            placeholderTextColor={colors.placeholder}
            value={task}
            onChangeText={setTask}
          />
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primaryLight }]}
            onPress={handleAddTask}
          >
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => openEditModal(item)}
              style={[
                styles.taskItem,
                {
                  backgroundColor: colors.white,
                  opacity: item.completed ? 0.7 : 1,
                },
              ]}
            >
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  toggleTaskCompletion(item.id, item.completed);
                }}
                style={styles.checkButton}
              >
                <Ionicons
                  name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={item.completed ? colors.success : colors.primaryLight}
                />
              </TouchableOpacity>

              <Text
                style={[
                  styles.taskText,
                  {
                    color: colors.textDark,
                    textDecorationLine: item.completed
                      ? 'line-through'
                      : 'none',
                  },
                ]}
              >
                {item.text}
              </Text>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteTask(item.id);
                }}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={colors.danger}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.modalContainer}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.white }]}
          >
            <Text style={[styles.modalTitle, { color: colors.primaryDark }]}>
              Editar Tarefa
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                {
                  borderColor: colors.primaryLight,
                  color: colors.textDark,
                },
              ]}
              value={editText}
              onChangeText={setEditText}
              placeholder="Editar tarefa..."
              placeholderTextColor={colors.placeholder}
              autoFocus={true}
            />

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.danger }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.success },
                ]}
                onPress={handleEditTask}
              >
                <Text style={styles.modalButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    padding: 20,
  },
  logo: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginBottom: -10,
    marginTop: -20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginRight: 10,
    backgroundColor: '#FFFFFF',
    color: '#3E2676',
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  listContainer: {
    paddingBottom: 20,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    backgroundColor: '#FFFFFF',
  },
  checkButton: {
    marginRight: 10,
  },
  taskText: {
    fontSize: 16,
    flex: 1,
    color: '#3E2676',
  },
  deleteButton: {
    marginLeft: 10,
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#3E2676',
  },
  modalInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
