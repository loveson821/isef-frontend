import { useCallback, useEffect, useRef, useState } from "react";
import ReactPaginate from "react-paginate";

interface YOLOConfirmPageProps {
  data: {
    crop_url: string;
    orig_url: string;
    pred_url: string;
    base: string;
    predict: {
      [page: string]: {
        [label: string]: {
          class: number;
          confidence: number;
          name: string;
          xmax: number;
          xmin: number;
          ymax: number;
          ymin: number;
        };
      };
    };
  };
}

function YOLOConfirmPage({ data: uploadFileToYOLOData }: YOLOConfirmPageProps) {
  const currentPageNumber = useRef(0);
  const [currentPredict, setCurrentPredict] = useState<any[]>([]);

  const updatePredict = useCallback(() => {
    if (uploadFileToYOLOData) {
      setCurrentPredict(
        Object.values(
          uploadFileToYOLOData.predict[currentPageNumber.current]
        ).filter((label) => label.name === "question")
      );
    }
  }, [uploadFileToYOLOData]);

  useEffect(() => {
    updatePredict();
  }, [uploadFileToYOLOData]);

  return (
    <div>
      <div className="flex flex-col items-start mb-4">
        {currentPredict.length > 0 ? (
          Object.entries(currentPredict).map(([index, a]) => {
            return (
              <div key={index} className="border-b w-full py-2 px-3">
                <img
                  alt="Image of the problem"
                  key={`${currentPageNumber}_${index}`}
                  src={`${process.env.NEXT_PUBLIC_PREDICT_FILES_URL}/${uploadFileToYOLOData.crop_url}/${currentPageNumber.current}_${index}.jpg`}
                />
              </div>
            );
          })
        ) : (
          <div className="self-center">沒有偵測到任何題目</div>
        )}
        <div className="font-bold mt-2 self-center">
          第 {currentPageNumber.current + 1} 頁
        </div>
      </div>
      <ReactPaginate
        nextLabel="下一頁"
        nextLinkClassName="py-2 px-3 hover:bg-gray-100 rounded"
        previousLabel="上一頁"
        previousLinkClassName="py-2 px-3 hover:bg-gray-100 rounded"
        pageCount={Object.keys(uploadFileToYOLOData.predict).length}
        onPageChange={(event) => {
          currentPageNumber.current = event.selected;
          updatePredict();
        }}
        pageRangeDisplayed={2}
        renderOnZeroPageCount={() => null}
        className="flex gap-2 justify-center items-center"
        pageLinkClassName="p-2 hover:underline"
        activeClassName="font-bold"
      />
    </div>
  );
}
export default YOLOConfirmPage;
