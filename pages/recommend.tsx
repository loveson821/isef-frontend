import { Combobox, Dialog, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import useAxios from "axios-hooks";
import { useRouter } from "next/router";
import { Fragment, useEffect, useState } from "react";
import { Oval } from "react-loader-spinner";
import PageDialog from "../components/PageDialog";

function Recommend() {
  const router = useRouter();

  const [concept, setConcept] = useState<string | null>(null);
  const [limit, setLimit] = useState<number>(5);
  const [query, setQuery] = useState("");

  useEffect(() => {
    router.push("/upload");
  }, []);

  const [
    { data: getRecommendationData, loading: getRecommendationLoading },
    getRecommendation,
  ] = useAxios(
    {
      baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
      method: "GET",
      url: "recommend",
    },
    { manual: true }
  );

  const [{ data: getLabelData, loading: getLabelLoading }, getLabel] = useAxios<
    string[]
  >({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    method: "GET",
    url: "label",
  });

  const filteredClassList =
    query === ""
      ? getLabelData
      : getLabelData?.filter((label) =>
          label.toLowerCase().includes(query.toLowerCase())
        );

  useEffect(() => {
    if (getLabelData != null) {
      setConcept(getLabelData[0]);
    }
  }, [getLabelData]);

  return (
    <PageDialog
      isOpen={true}
      onClose={() => {
        router.push("/");
      }}
    >
      <Dialog.Panel className="w-full max-w-xl transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
        <Dialog.Title
          as="h3"
          className="text-lg font-medium leading-6 text-gray-900"
        >
          獲取題目
        </Dialog.Title>
        <Combobox as={Fragment} value={concept} onChange={setConcept}>
          <div className="relative my-6">
            <div className="relative w-full h-full flex items-center overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 cursor-pointer sm:text-sm">
              <Combobox.Input
                className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 focus:ring-0 bg-transparent"
                displayValue={() => concept || ""}
                onChange={(event) => setQuery(event.target.value)}
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
              <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
                {filteredClassList?.length === 0 && query !== "" ? (
                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                    沒有任何結果
                  </div>
                ) : (
                  filteredClassList?.map((className) => (
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
                              <CheckIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
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
        <div className="mt-4 flex items-center flex-wrap gap-2">
          <button
            type="submit"
            className={`ml-auto inline-flex justify-center items-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2${
              getRecommendationLoading ? " opacity-50" : ""
            }`}
            {...{
              disabled: getRecommendationLoading,
            }}
            onClick={() => {
              getRecommendation({
                url: `recommend?concept=${concept}&limit=${limit}`,
              });
            }}
          >
            {getRecommendationLoading ? (
              <>
                <Oval
                  height={16}
                  width={16}
                  strokeWidth={8}
                  color={"#ffffff"}
                  secondaryColor={"#aaaaaa"}
                />
                提交中...
              </>
            ) : (
              "完成"
            )}
          </button>
        </div>
      </Dialog.Panel>
    </PageDialog>
  );
}

export default Recommend;
