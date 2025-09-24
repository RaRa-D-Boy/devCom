-- Create a default general chat room
INSERT INTO public.chat_rooms (id, name, description, created_by)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'General',
  'Welcome to the general chat room! This is where everyone can chat.',
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Function to automatically add new users to the general room
CREATE OR REPLACE FUNCTION public.add_user_to_general_room()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.room_members (room_id, user_id)
  VALUES ('00000000-0000-0000-0000-000000000001', NEW.id)
  ON CONFLICT (room_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to add new users to general room
DROP TRIGGER IF EXISTS add_to_general_room ON public.profiles;
CREATE TRIGGER add_to_general_room
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.add_user_to_general_room();
