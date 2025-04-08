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
  Alert,
} from 'react-native';
import { ref, push, onValue, remove, update } from 'firebase/database';
import { database, auth } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

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

export default function AdvancedTasksScreen() {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [editText, setEditText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [subtaskText, setSubtaskText] = useState('');

  useEffect(() => {
    if (auth.currentUser) {
      const tasksRef = ref(database, `tasks/${auth.currentUser.uid}`);

      const unsubscribe = onValue(tasksRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const tasksList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
            subtasks: data[key].subtasks || [],
          }));
          setTasks(tasksList);
        } else {
          setTasks([]);
        }
      });

      return () => unsubscribe();
    }
  }, []);

  const handleAddTask = async () => {
    if (task.trim() && auth.currentUser) {
      const tasksRef = ref(database, `tasks/${auth.currentUser.uid}`);
      const newTask = {
        text: task,
        completed: false,
        createdAt: new Date().toISOString(),
        subtasks: [],
      };

      await push(tasksRef, newTask);
      setTask('');
    }
  };

  const handleDeleteTask = (id) => {
    if (auth.currentUser) {
      Alert.alert(
        'Confirmar Exclusão',
        'Tem certeza que deseja excluir esta tarefa?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: () => {
              const taskRef = ref(
                database,
                `tasks/${auth.currentUser.uid}/${id}`
              );
              remove(taskRef);
            },
          },
        ]
      );
    }
  };

  const toggleTaskCompletion = (id, currentStatus) => {
    if (auth.currentUser) {
      const taskRef = ref(database, `tasks/${auth.currentUser.uid}/${id}`);
      update(taskRef, {
        completed: !currentStatus,
        completedAt: !currentStatus ? new Date().toISOString() : null,
      });
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

  const addSubtask = (taskId) => {
    if (auth.currentUser && subtaskText.trim()) {
      const taskRef = ref(database, `tasks/${auth.currentUser.uid}/${taskId}`);
      const task = tasks.find((t) => t.id === taskId);
      const newSubtask = {
        text: subtaskText,
        completed: false,
        id: Date.now().toString(),
      };

      update(taskRef, {
        subtasks: [...task.subtasks, newSubtask],
      });

      setSubtaskText('');
    }
  };

  const toggleSubtask = (taskId, subtaskId) => {
    if (auth.currentUser) {
      const taskRef = ref(database, `tasks/${auth.currentUser.uid}/${taskId}`);
      const task = tasks.find((t) => t.id === taskId);
      const updatedSubtasks = task.subtasks.map((st) =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      );

      const allSubtasksCompleted = updatedSubtasks.every((st) => st.completed);

      update(taskRef, {
        subtasks: updatedSubtasks,
        completed: allSubtasksCompleted,
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Minhas Tarefas</Text>

        {/* Input para nova tarefa */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nova tarefa..."
            placeholderTextColor={colors.placeholder}
            value={task}
            onChangeText={setTask}
          />

          <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Lista de tarefas */}
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[styles.taskItem, item.completed && styles.completedTask]}
            >
              {/* Cabeçalho da tarefa */}
              <View style={styles.taskHeader}>
                <TouchableOpacity
                  onPress={() => toggleTaskCompletion(item.id, item.completed)}
                  style={styles.checkButton}
                >
                  <Ionicons
                    name={
                      item.completed ? 'checkmark-circle' : 'ellipse-outline'
                    }
                    size={24}
                    color={
                      item.completed ? colors.success : colors.primaryLight
                    }
                  />
                </TouchableOpacity>

                <Pressable
                  onPress={() => openEditModal(item)}
                  style={styles.taskTextContainer}
                >
                  <Text
                    style={[
                      styles.taskText,
                      item.completed && styles.completedTaskText,
                    ]}
                  >
                    {item.text}
                  </Text>
                </Pressable>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteTask(item.id)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.danger}
                  />
                </TouchableOpacity>
              </View>

              {/* Subtarefas */}
              <View style={styles.subtasksContainer}>
                <FlatList
                  data={item.subtasks}
                  keyExtractor={(subtask) => subtask.id}
                  renderItem={({ item: subtask }) => (
                    <View style={styles.subtaskItem}>
                      <TouchableOpacity
                        onPress={() => toggleSubtask(item.id, subtask.id)}
                        style={styles.subtaskCheckButton}
                      >
                        <Ionicons
                          name={
                            subtask.completed
                              ? 'checkmark-circle'
                              : 'ellipse-outline'
                          }
                          size={18}
                          color={
                            subtask.completed
                              ? colors.success
                              : colors.primaryLight
                          }
                        />
                      </TouchableOpacity>

                      <Text
                        style={[
                          styles.subtaskText,
                          subtask.completed && styles.completedSubtaskText,
                        ]}
                      >
                        {subtask.text}
                      </Text>
                    </View>
                  )}
                />

                {/* Input para nova subtarefa */}
                <View style={styles.subtaskInputContainer}>
                  <TextInput
                    style={styles.subtaskInput}
                    placeholder="Adicionar subtarefa..."
                    placeholderTextColor={colors.placeholder}
                    value={subtaskText}
                    onChangeText={setSubtaskText}
                    onSubmitEditing={() => addSubtask(item.id)}
                  />
                  <TouchableOpacity
                    style={styles.addSubtaskButton}
                    onPress={() => addSubtask(item.id)}
                  >
                    <Ionicons name="add" size={18} color={colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      {/* Modal de edição */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Tarefa</Text>

            <TextInput
              style={styles.modalInput}
              value={editText}
              onChangeText={setEditText}
              placeholder="Editar tarefa..."
              placeholderTextColor={colors.placeholder}
              autoFocus={true}
            />

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
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
    backgroundColor: colors.primaryDark,
  },
  innerContainer: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: colors.white,
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
    borderColor: colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginRight: 10,
    backgroundColor: colors.white,
    color: colors.textDark,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    elevation: 3,
  },
  listContainer: {
    paddingBottom: 20,
  },
  taskItem: {
    backgroundColor: colors.white,
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    elevation: 2,
  },
  completedTask: {
    opacity: 0.7,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkButton: {
    marginRight: 10,
  },
  taskTextContainer: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    color: colors.textDark,
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: colors.placeholder,
  },
  deleteButton: {
    marginLeft: 10,
    padding: 8,
  },
  subtasksContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.accent,
    paddingTop: 10,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingLeft: 10,
  },
  subtaskCheckButton: {
    marginRight: 8,
  },
  subtaskText: {
    fontSize: 14,
    color: colors.textDark,
  },
  completedSubtaskText: {
    textDecorationLine: 'line-through',
    color: colors.placeholder,
  },
  subtaskInputContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  subtaskInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    backgroundColor: colors.white,
    color: colors.textDark,
  },
  addSubtaskButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    marginLeft: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: colors.textDark,
  },
  modalInput: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
    fontSize: 16,
    color: colors.textDark,
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
  cancelButton: {
    backgroundColor: colors.danger,
  },
  saveButton: {
    backgroundColor: colors.success,
  },
  modalButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
});
