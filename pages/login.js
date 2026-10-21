export default function Login() { return null }

export function getServerSideProps() {
  return { redirect: { destination: '/', permanent: false } }
}
