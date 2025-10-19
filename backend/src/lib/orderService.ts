import type { OrderDTO, OrderCreateRequest } from '@/types/dto';

// TODO: replace with real Supabase queries
const mockPets = [
  { id: 'p1', name: 'Zuzu', species: 'dog', state: 'sick' as const },
  { id: 'p2', name: 'Blinky', species: 'blob', state: 'dead' as const },
  { id: 'p3', name: 'Mochi', species: 'cat', state: 'healthy' as const },
];

let mockOrders: OrderDTO[] = [];

export async function validateAction(req: OrderCreateRequest) {
  const pet = mockPets.find((p) => p.id === req.petId);
  if (!pet) throw new Error('Pet not found');

  if (req.action === 'heal' && pet.state !== 'sick') throw new Error('Pet must be sick to heal');
  if (req.action === 'revive' && pet.state !== 'dead') throw new Error('Pet must be dead to revive');
  if (req.action === 'buy' && pet.state !== 'healthy') throw new Error('Can only buy healthy listings (mock rule)');

  return { pet };
}

export async function createOrderMock(userId: string, petId: string, action: OrderDTO['action']): Promise<OrderDTO> {
  const id = `ord_${Math.random().toString(36).slice(2, 10)}`;
  const order: OrderDTO = { id, userId, petId, action, status: 'pending' };
  mockOrders.push(order);
  return order;
}

export async function getOrderMock(id: string) {
  return mockOrders.find((o) => o.id === id) || null;
}

export async function markOrderSucceededMock(id: string) {
  const o = mockOrders.find((m) => m.id === id);
  if (o) o.status = 'succeeded';
  return o;
}
