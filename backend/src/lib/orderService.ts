
import type { OrderDTO, OrderCreateRequest } from '@/types/dto';
import { get } from 'http';
import { getSupabaseBrowser } from './supabaseClient';
import { getSupabaseServer } from './supabaseServer';

export async function validateAction(req: OrderCreateRequest) {
  const supabase = getSupabaseServer();
  const { data: pet, error } = await supabase
    .from('pets')
    .select('id,state')
    .eq('id', req.petId)
    .single();
  if (error || !pet) throw new Error('Pet not found');

  if (req.action === 'heal'   && pet.state !== 'sick')  throw new Error('Pet must be sick to heal');
  if (req.action === 'revive' && pet.state !== 'dead')  throw new Error('Pet must be dead to revive');
  if (req.action === 'buy'    && pet.state !== 'healthy') throw new Error('Pet must be healthy to buy');

  return { pet };
}

export async function createOrderMock(userId: string, petId: string, action: OrderDTO['action']): Promise<OrderDTO> {
  // rename later; keeping name so routes work unchanged
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      pet_id: petId,
      action,
      status: 'pending'
    })
    .select('id,user_id,pet_id,action,status')
    .single();
  if (error || !data) throw new Error('Failed to create order');
  return { 
    id: data.id, userId: data.user_id, petId: data.pet_id, 
    action: data.action, status: data.status 
  };
}

export async function getOrderMock(id: string) {
  const supabase = getSupabaseServer();
  const { data } = await supabase.from('orders')
    .select('id,status')
    .eq('id', id)
    .single();
  return data ? { id: data.id, status: data.status } : null;
}

export async function markOrderSucceededMock(id: string) {
  const supabase = getSupabaseServer();
  const { data } = await supabase.from('orders')
    .update({ status: 'succeeded' })
    .eq('id', id)
    .select('id,status')
    .single();
  return data ? { id: data.id, status: data.status } : null;
}
