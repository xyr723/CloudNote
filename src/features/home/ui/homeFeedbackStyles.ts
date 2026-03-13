import {StyleSheet} from 'react-native';

export const homeFeedbackStyles = StyleSheet.create({
  deleteModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '80%',
    elevation: 5,
  },
  deleteIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FDFAFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  deleteIcon: {
    fontSize: 32,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#A98DB8',
    marginBottom: 10,
  },
  deleteMessage: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteSubMessage: {
    fontSize: 14,
    color: '#E5A4C4',
    marginBottom: 20,
    textAlign: 'center',
  },
  deleteButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  deleteButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginHorizontal: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelDeleteButton: {
    backgroundColor: '#FDFAFF',
    borderWidth: 1,
    borderColor: '#C5A3E6',
  },
  confirmDeleteButton: {
    backgroundColor: '#E5A4C4',
  },
  cancelDeleteButtonText: {
    color: '#A98DB8',
    fontWeight: '600',
    fontSize: 15,
  },
  confirmDeleteButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  saveToastContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  saveToastContent: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  saveToastText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
