import { Combobox, Transition } from "@headlessui/react";
import {
  Dispatch,
  Fragment,
  MouseEvent,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import ReactPaginate from "react-paginate";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
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
  classList: string[] | undefined;
}

function ClassifyConfirmPage({
  data = {},
  setConfirmedClasses = () => {},
  confirmedClasses,
  classList = [],
}: ClassifyConfirmPageProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [currentKey, setCurrentKey] = useState("");
  const [query, setQuery] = useState("");
  const [selectedOption, setSelectedOption] = useState("");

  const filteredClassList =
    query === ""
      ? classList
      : classList.filter((className) =>
          className.toLowerCase().includes(query.toLowerCase())
        );

  const optionClickHanlder = useCallback(
    (id: string, qclass: string) => {
      setConfirmedClasses((prevState) => {
        console.log(qclass);
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
    const currentConfirmedQuestion =
      confirmedClasses?.questions?.[Object.keys(data)[currentPage]];
    console.log(currentConfirmedQuestion, Object.values(data)[currentPage][1]);
    if (
      (currentConfirmedQuestion != null &&
        Object.values(data)[currentPage][1].includes(
          currentConfirmedQuestion
        )) ||
      currentConfirmedQuestion == null
    ) {
      setSelectedOption(classList[0]);
    } else {
      console.log("hi");
      setSelectedOption(currentConfirmedQuestion);
    }
    setCurrentKey(Object.keys(data)[currentPage]);
  }, [currentPage, data]);

  useEffect(() => {
    setSelectedOption(classList[0]);
  }, [classList]);

  useEffect(() => console.log(selectedOption));

  return (
    <div>
      <div className="my-6 flex flex-col items-center">
        <img
          src={`${process.env.NEXT_PUBLIC_PREDICT_FILES_URL}/${
            Object.values(data)[currentPage][0]
          }`}
          alt="Image of the problem"
        />
        <div className="mt-2 flex gap-2 flex-wrap justify-start">
          {Object.values(data)[currentPage][1].map((c) => (
            <div
              className={`text-center px-4 py-3 rounded-lg cursor-pointer flex items-center shadow-md ${
                confirmedClasses?.questions?.[currentKey] === c
                  ? "bg-blue-100 hover:bg-blue-200"
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
      <Combobox
        as={Fragment}
        value={selectedOption}
        onChange={(value) => {
          setSelectedOption(value);
          optionClickHanlder(currentKey, value);
        }}
      >
        <div className="relative mb-6">
          <div
            className={`relative w-full h-full flex items-center overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 cursor-pointer sm:text-sm ${
              selectedOption === confirmedClasses?.questions?.[currentKey]
                ? "bg-blue-100 hover:bg-blue-200"
                : "hover:bg-gray-100"
            }`}
          >
            <Combobox.Input
              className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 focus:ring-0 bg-transparent"
              displayValue={() => selectedOption}
              onChange={(event) => setQuery(event.target.value)}
              onClick={() => optionClickHanlder(currentKey, selectedOption)}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-600"
                aria-hidden="true"
              />
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery("")}
          >
            <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
              {filteredClassList.length === 0 && query !== "" ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  沒有任何結果
                </div>
              ) : (
                filteredClassList.map((className) => (
                  <Combobox.Option
                    key={className}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                        active ? "bg-teal-600 text-white" : "text-gray-900"
                      }`
                    }
                    value={className}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {className}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? "text-white" : "text-teal-600"
                            }`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
      <div>{confirmedClasses?.questions?.[currentKey]}</div>
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
