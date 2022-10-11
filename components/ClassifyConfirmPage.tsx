import {
  Dispatch,
  MouseEvent,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import ReactPaginate from "react-paginate";
interface confirmedClassesInterface {
  base: string;
  questions: {
    [id: string]: string;
  };
}

interface ClassifyConfirmPageProps {
  data: {
    [problem_id: string]: { 0: string; 1: string[] };
  };
  confirmedClasses: confirmedClassesInterface;
  setConfirmedClasses: Dispatch<SetStateAction<confirmedClassesInterface>>;
}
function ClassifyConfirmPage({
  data = {},
  setConfirmedClasses = () => {},
  confirmedClasses,
}: ClassifyConfirmPageProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [currentKey, setCurrentKey] = useState("");
  const optionClickHanlder = useCallback(
    (id: string, qclass: string) => {
      setConfirmedClasses((prevState) => {
        return {
          base: prevState.base,
          questions: {
            ...prevState.questions,
            [id]: qclass,
          },
        };
      });
    },
    [setConfirmedClasses]
  );

  useEffect(() => {
    setCurrentKey(Object.keys(data)[currentPage]);
  }, [currentPage, data]);
  return (
    <div>
      <div className="my-6 flex flex-col items-center">
        <img
          src={`${process.env.NEXT_PUBLIC_PREDICT_FILES_URL}/${
            Object.values(data)[currentPage][0]
          }`}
          alt="Image of the problem"
        />
        <div className="mt-2 flex gap-2 flex-wrap justify-center">
          {Object.values(data)[currentPage][1].map((c) => (
            <div
              className={`text-center px-4 py-3 rounded-lg cursor-pointer flex items-center border ${
                confirmedClasses?.questions?.[currentKey] === c
                  ? "bg-gray-200 hover:bg-gray-300"
                  : "hover:bg-gray-100"
              }`}
              key={c}
              onClick={() => optionClickHanlder(currentKey, c)}
            >
              {c}
            </div>
          ))}
        </div>
      </div>
      <ReactPaginate
        nextLabel="下一題"
        nextLinkClassName="py-2 px-3 hover:bg-gray-100 rounded"
        previousLabel="上一題"
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
