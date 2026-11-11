import { Redirect } from 'expo-router';

/** `/create` (Home "Create") opens step 1. */
export default function CreateIndex() {
  return <Redirect href="/create/basics" />;
}
