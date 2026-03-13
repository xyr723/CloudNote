export const statusStyles = {
  modalContent: {
    width: '80%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIcon: {
    fontSize: 30,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubMessage: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    marginTop: 10,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
} as const;
