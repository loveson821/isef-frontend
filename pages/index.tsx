import Link from "next/link";

function Home() {
  return (
    <div className="flex items-center justify-center h-screen gap-4">
      <Link href={"/upload"}>
        <a className="px-5 py-3 bg-green-100 rounded shadow hover:bg-green-200 text-green-900 text-lg font-bold">
          上載並分析題目
        </a>
      </Link>
      <Link href={"/recommend"}>
        <a className="px-5 py-3 bg-blue-100 rounded shadow hover:bg-blue-200 text-blue-900 text-lg font-bold">
          獲取分類題目
        </a>
      </Link>
    </div>
  );
}
export default Home;
