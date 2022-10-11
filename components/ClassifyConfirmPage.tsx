import { useState } from "react";
import ReactPaginate from "react-paginate";

interface ClassifyConfirmPageProps {
  data: {
    [problem_id: string]: { 0: string; 1: string[] };
  };
}
function ClassifyConfirmPage({ data }: ClassifyConfirmPageProps) {
  const [currentPage, setCurrentPage] = useState(0);
  return (
    <div>
      <div className="my-6 flex flex-col items-center">
        <img
          src={`${process.env.NEXT_PUBLIC_PREDICT_FILES_URL}/${
            Object.values(data)[currentPage][0]
          }`}
        />
        <div className="mt-2 flex gap-2 flex-wrap justify-center">
          {Object.values(data)[currentPage][1].map((c) => (
            <div
              className="text-center px-4 py-3 border rounded-lg hover:bg-gray-100 cursor-pointer"
              key={c}
            >
              {c}
            </div>
          ))}
        </div>
      </div>
      <ReactPaginate
        nextLabel="下一頁"
        nextLinkClassName="py-2 px-3 hover:bg-gray-100 rounded"
        previousLabel="上一頁"
        previousLinkClassName="py-2 px-3 hover:bg-gray-100 rounded"
        onPageChange={(event) => setCurrentPage(event.selected)}
        pageCount={Object.keys(data).length}
        pageRangeDisplayed={2}
        renderOnZeroPageCount={() => null}
        className="flex gap-2 justify-center items-center"
        pageLinkClassName="p-2 hover:underline"
        activeClassName="font-bold"
      />
    </div>
  );
}
export default ClassifyConfirmPage;
