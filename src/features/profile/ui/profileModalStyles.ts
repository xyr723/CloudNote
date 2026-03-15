import {StyleSheet} from 'react-native';

export const profileModalStyles = StyleSheet.create({
  avatarContainer: {
    alignItems: 'center',
    borderRadius: 40,
    elevation: 4,
    height: 80,
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: 80,
  },
  avatarImage: {
    borderRadius: 40,
    height: '100%',
    width: '100%',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingTop: 12,
  },
  logoutButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 50,
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 24,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuArrow: {
    fontSize: 20,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuItem: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuSection: {
    marginTop: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
  },
  modalButton: {
    borderRadius: 8,
    minWidth: 100,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalContent: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 20,
    width: '80%',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  statLabel: {
    fontSize: 14,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  version: {
    fontSize: 12,
    marginBottom: 32,
    marginTop: 16,
    textAlign: 'center',
  },
});
